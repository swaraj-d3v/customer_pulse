-- Customer health scoring model
-- ---------------------------------------------
-- This script builds a materialized view that rolls up customer activity
-- into a single health score between 0 and 100.
--
-- Inputs currently available in the database:
--   - customers: commercial/account profile
--   - events: product usage and payment events
--
-- Notes on "tickets":
--   The current warehouse does not yet contain a dedicated support ticket
--   fact table. Until one exists, this model uses a conservative proxy:
--   customers without tech support ("TechSupport" = 'No') are treated as
--   operationally more fragile, while customers with tech support enabled
--   receive a small positive adjustment.
--
-- Refresh guidance:
--   REFRESH MATERIALIZED VIEW customer_health;

DROP MATERIALIZED VIEW IF EXISTS customer_health;

CREATE MATERIALIZED VIEW customer_health AS
WITH customer_base AS (
    SELECT
        c.customer_id,
        c.plan,
        c.region,
        c.industry,
        c.mrr,
        c.total_revenue,
        c.churned,
        c.signup_date,
        c.contract_months,
        c.nps_score,
        c.csm_owner,
        c."TechSupport" AS tech_support_flag
    FROM customers c
),
event_daily AS (
    -- Daily event grain keeps the later trend calculations predictable and
    -- avoids repeatedly scanning the raw event table in downstream CTEs.
    SELECT
        e.customer_id,
        DATE_TRUNC('day', e.event_date)::date AS event_day,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE e.event_type = 'login') AS login_events,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used') AS feature_events,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_success') AS payment_success_events,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_failed') AS payment_failed_events,
        AVG(e.session_duration_mins) FILTER (WHERE e.event_type = 'login') AS avg_session_mins
    FROM events e
    GROUP BY 1, 2
),
activity_windows AS (
    -- We summarize across recent rolling windows to capture both current
    -- activity and short-term trend direction.
    SELECT
        ed.customer_id,
        SUM(ed.login_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '30 day') AS logins_30d,
        SUM(ed.login_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '60 day'
                                     AND ed.event_day < CURRENT_DATE - INTERVAL '30 day') AS logins_prev_30d,
        SUM(ed.feature_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '30 day') AS features_30d,
        SUM(ed.feature_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '60 day'
                                       AND ed.event_day < CURRENT_DATE - INTERVAL '30 day') AS features_prev_30d,
        SUM(ed.payment_success_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '90 day') AS payments_success_90d,
        SUM(ed.payment_failed_events) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '90 day') AS payments_failed_90d,
        AVG(ed.avg_session_mins) FILTER (WHERE ed.event_day >= CURRENT_DATE - INTERVAL '30 day') AS avg_session_mins_30d,
        MAX(ed.event_day) AS last_event_day
    FROM event_daily ed
    GROUP BY ed.customer_id
),
weekly_activity AS (
    -- Weekly buckets allow window functions to detect directional changes
    -- without being too noisy at the individual-day level.
    SELECT
        e.customer_id,
        DATE_TRUNC('week', e.event_date)::date AS event_week,
        COUNT(*) FILTER (WHERE e.event_type = 'login') AS login_events,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used') AS feature_events,
        COUNT(*) AS total_events
    FROM events e
    WHERE e.event_date >= CURRENT_DATE - INTERVAL '84 day'
    GROUP BY 1, 2
),
weekly_trends AS (
    SELECT
        wa.customer_id,
        wa.event_week,
        wa.login_events,
        wa.feature_events,
        wa.total_events,
        AVG(wa.login_events) OVER (
            PARTITION BY wa.customer_id
            ORDER BY wa.event_week
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS login_4wk_avg,
        AVG(wa.feature_events) OVER (
            PARTITION BY wa.customer_id
            ORDER BY wa.event_week
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS feature_4wk_avg,
        LAG(wa.login_events) OVER (
            PARTITION BY wa.customer_id
            ORDER BY wa.event_week
        ) AS prev_week_logins,
        LAG(wa.feature_events) OVER (
            PARTITION BY wa.customer_id
            ORDER BY wa.event_week
        ) AS prev_week_features
    FROM weekly_activity wa
),
latest_trends AS (
    -- DISTINCT ON is used here to keep only the most recent weekly trend
    -- snapshot for each customer.
    SELECT DISTINCT ON (wt.customer_id)
        wt.customer_id,
        wt.event_week AS latest_event_week,
        wt.login_events AS latest_week_logins,
        wt.feature_events AS latest_week_features,
        wt.login_4wk_avg,
        wt.feature_4wk_avg,
        wt.prev_week_logins,
        wt.prev_week_features
    FROM weekly_trends wt
    ORDER BY wt.customer_id, wt.event_week DESC
),
ticket_proxy AS (
    -- Placeholder support signal until a real ticket table is loaded.
    -- Customers with tech support enabled are given a slight resiliency boost.
    SELECT
        cb.customer_id,
        CASE
            WHEN cb.tech_support_flag = 'Yes' THEN 1
            ELSE 0
        END AS support_enabled,
        CASE
            WHEN cb.tech_support_flag = 'Yes' THEN 0
            ELSE 1
        END AS support_risk_flag
    FROM customer_base cb
),
scored AS (
    SELECT
        cb.customer_id,
        cb.plan,
        cb.region,
        cb.industry,
        cb.mrr,
        cb.total_revenue,
        cb.churned,
        cb.signup_date,
        cb.contract_months,
        cb.nps_score,
        cb.csm_owner,
        aw.last_event_day,
        COALESCE(aw.logins_30d, 0) AS logins_30d,
        COALESCE(aw.logins_prev_30d, 0) AS logins_prev_30d,
        COALESCE(aw.features_30d, 0) AS features_30d,
        COALESCE(aw.features_prev_30d, 0) AS features_prev_30d,
        COALESCE(aw.payments_success_90d, 0) AS payments_success_90d,
        COALESCE(aw.payments_failed_90d, 0) AS payments_failed_90d,
        COALESCE(aw.avg_session_mins_30d, 0) AS avg_session_mins_30d,
        COALESCE(tp.support_enabled, 0) AS support_enabled,
        COALESCE(tp.support_risk_flag, 1) AS support_risk_flag,
        COALESCE(lt.latest_week_logins, 0) AS latest_week_logins,
        COALESCE(lt.latest_week_features, 0) AS latest_week_features,
        COALESCE(lt.login_4wk_avg, 0) AS login_4wk_avg,
        COALESCE(lt.feature_4wk_avg, 0) AS feature_4wk_avg,
        CASE
            WHEN COALESCE(aw.logins_prev_30d, 0) = 0 THEN NULL
            ELSE ROUND(((COALESCE(aw.logins_30d, 0) - aw.logins_prev_30d)::numeric / aw.logins_prev_30d) * 100, 2)
        END AS login_trend_pct,
        CASE
            WHEN COALESCE(aw.features_prev_30d, 0) = 0 THEN NULL
            ELSE ROUND(((COALESCE(aw.features_30d, 0) - aw.features_prev_30d)::numeric / aw.features_prev_30d) * 100, 2)
        END AS feature_trend_pct,
        GREATEST(
            0,
            LEAST(
                100,
                ROUND(
                    (
                        -- Usage intensity
                        LEAST(COALESCE(aw.logins_30d, 0) * 1.2, 25)
                        + LEAST(COALESCE(aw.features_30d, 0) * 1.5, 25)
                        -- Engagement quality
                        + LEAST(COALESCE(aw.avg_session_mins_30d, 0) / 2.0, 10)
                        + LEAST(GREATEST(cb.nps_score, 0) / 10.0, 10)
                        -- Payment health
                        + LEAST(COALESCE(aw.payments_success_90d, 0) * 2.0, 15)
                        - LEAST(COALESCE(aw.payments_failed_90d, 0) * 4.0, 20)
                        -- Relationship/account resiliency
                        + CASE WHEN cb.contract_months >= 12 THEN 5 ELSE 0 END
                        + CASE WHEN tp.support_enabled = 1 THEN 3 ELSE 0 END
                        -- Penalize engagement deterioration
                        + CASE
                            WHEN COALESCE(aw.logins_prev_30d, 0) > 0
                                 AND COALESCE(aw.logins_30d, 0) < aw.logins_prev_30d * 0.60
                            THEN -10 ELSE 0
                          END
                        + CASE
                            WHEN COALESCE(aw.features_prev_30d, 0) > 0
                                 AND COALESCE(aw.features_30d, 0) < aw.features_prev_30d * 0.60
                            THEN -10 ELSE 0
                          END
                        -- Penalize inactivity recency
                        + CASE
                            WHEN aw.last_event_day IS NULL THEN -20
                            WHEN aw.last_event_day < CURRENT_DATE - INTERVAL '30 day' THEN -15
                            WHEN aw.last_event_day < CURRENT_DATE - INTERVAL '14 day' THEN -8
                            ELSE 0
                          END
                    )::numeric,
                    0
                )
            )
        )::integer AS health_score
    FROM customer_base cb
    LEFT JOIN activity_windows aw
        ON cb.customer_id = aw.customer_id
    LEFT JOIN latest_trends lt
        ON cb.customer_id = lt.customer_id
    LEFT JOIN ticket_proxy tp
        ON cb.customer_id = tp.customer_id
)
SELECT
    s.*,
    CASE
        WHEN s.health_score >= 75 THEN 'Healthy'
        WHEN s.health_score >= 45 THEN 'At Risk'
        ELSE 'Critical'
    END AS risk_tier
FROM scored s;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_health_customer_id
    ON customer_health (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_health_risk_tier
    ON customer_health (risk_tier);

CREATE INDEX IF NOT EXISTS idx_customer_health_score
    ON customer_health (health_score);
