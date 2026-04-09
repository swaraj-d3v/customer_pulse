-- Churn signal detection
-- ---------------------------------------------
-- This view surfaces behavior patterns commonly associated with churn:
--   - recency and usage decline
--   - payment instability
--   - low relative engagement percentile
--   - rank-based prioritization for investigation
--
-- Window functions used:
--   - LAG(): compare current week to previous week
--   - NTILE(): place customers into engagement buckets
--   - RANK(): prioritize strongest churn-risk candidates

DROP VIEW IF EXISTS churn_signals;

CREATE VIEW churn_signals AS
WITH weekly_usage AS (
    SELECT
        e.customer_id,
        DATE_TRUNC('week', e.event_date)::date AS event_week,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE e.event_type = 'login') AS login_events,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used') AS feature_events,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_success') AS payment_success_events,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_failed') AS payment_failed_events
    FROM events e
    WHERE e.event_date >= CURRENT_DATE - INTERVAL '180 day'
    GROUP BY 1, 2
),
weekly_deltas AS (
    SELECT
        wu.customer_id,
        wu.event_week,
        wu.total_events,
        wu.login_events,
        wu.feature_events,
        wu.payment_success_events,
        wu.payment_failed_events,
        LAG(wu.total_events) OVER (
            PARTITION BY wu.customer_id
            ORDER BY wu.event_week
        ) AS prev_total_events,
        LAG(wu.login_events) OVER (
            PARTITION BY wu.customer_id
            ORDER BY wu.event_week
        ) AS prev_login_events,
        LAG(wu.feature_events) OVER (
            PARTITION BY wu.customer_id
            ORDER BY wu.event_week
        ) AS prev_feature_events
    FROM weekly_usage wu
),
latest_week AS (
    SELECT DISTINCT ON (wd.customer_id)
        wd.customer_id,
        wd.event_week,
        wd.total_events,
        wd.login_events,
        wd.feature_events,
        wd.payment_success_events,
        wd.payment_failed_events,
        wd.prev_total_events,
        wd.prev_login_events,
        wd.prev_feature_events,
        CASE
            WHEN COALESCE(wd.prev_total_events, 0) = 0 THEN NULL
            ELSE ROUND(((wd.total_events - wd.prev_total_events)::numeric / wd.prev_total_events) * 100, 2)
        END AS total_event_change_pct,
        CASE
            WHEN COALESCE(wd.prev_login_events, 0) = 0 THEN NULL
            ELSE ROUND(((wd.login_events - wd.prev_login_events)::numeric / wd.prev_login_events) * 100, 2)
        END AS login_change_pct,
        CASE
            WHEN COALESCE(wd.prev_feature_events, 0) = 0 THEN NULL
            ELSE ROUND(((wd.feature_events - wd.prev_feature_events)::numeric / wd.prev_feature_events) * 100, 2)
        END AS feature_change_pct
    FROM weekly_deltas wd
    ORDER BY wd.customer_id, wd.event_week DESC
),
engagement_baseline AS (
    SELECT
        e.customer_id,
        COUNT(*) FILTER (WHERE e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS events_30d,
        COUNT(*) FILTER (WHERE e.event_type = 'login'
                         AND e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS logins_30d,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used'
                         AND e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS features_30d,
        MAX(e.event_date) AS last_event_at
    FROM events e
    GROUP BY e.customer_id
),
distribution AS (
    -- NTILE(5) gives a simple percentile-like segmentation that is easy for
    -- operators to interpret. Bucket 1 is the lowest-engagement cohort.
    SELECT
        eb.*,
        NTILE(5) OVER (
            ORDER BY COALESCE(eb.events_30d, 0), COALESCE(eb.logins_30d, 0), COALESCE(eb.features_30d, 0)
        ) AS engagement_ntile
    FROM engagement_baseline eb
),
joined AS (
    SELECT
        c.customer_id,
        c.plan,
        c.region,
        c.industry,
        c.mrr,
        c.contract_months,
        c.nps_score,
        c.churned,
        c.churn_date,
        d.events_30d,
        d.logins_30d,
        d.features_30d,
        d.last_event_at,
        d.engagement_ntile,
        lw.event_week AS latest_week,
        lw.total_events,
        lw.login_events,
        lw.feature_events,
        lw.payment_success_events,
        lw.payment_failed_events,
        lw.total_event_change_pct,
        lw.login_change_pct,
        lw.feature_change_pct,
        CASE
            WHEN COALESCE(lw.total_event_change_pct, 0) <= -50
                 OR COALESCE(lw.login_change_pct, 0) <= -50
                 OR COALESCE(lw.feature_change_pct, 0) <= -50
            THEN 1 ELSE 0
        END AS sharp_engagement_drop_flag,
        CASE
            WHEN COALESCE(lw.payment_failed_events, 0) > COALESCE(lw.payment_success_events, 0)
            THEN 1 ELSE 0
        END AS payment_stress_flag,
        CASE
            WHEN d.last_event_at < CURRENT_DATE - INTERVAL '21 day'
            THEN 1 ELSE 0
        END AS inactivity_flag
    FROM customers c
    LEFT JOIN distribution d
        ON c.customer_id = d.customer_id
    LEFT JOIN latest_week lw
        ON c.customer_id = lw.customer_id
),
ranked AS (
    SELECT
        j.*,
        (
            CASE WHEN j.sharp_engagement_drop_flag = 1 THEN 35 ELSE 0 END
            + CASE WHEN j.payment_stress_flag = 1 THEN 25 ELSE 0 END
            + CASE WHEN j.inactivity_flag = 1 THEN 25 ELSE 0 END
            + CASE WHEN j.engagement_ntile = 1 THEN 10
                   WHEN j.engagement_ntile = 2 THEN 5
                   ELSE 0
              END
            + CASE WHEN j.contract_months = 1 THEN 5 ELSE 0 END
        ) AS churn_signal_score
    FROM joined j
)
SELECT
    r.*,
    CASE
        WHEN r.churn_signal_score >= 60 THEN 'High'
        WHEN r.churn_signal_score >= 30 THEN 'Medium'
        ELSE 'Low'
    END AS churn_risk_band,
    RANK() OVER (
        ORDER BY r.churn_signal_score DESC, r.mrr DESC, r.customer_id
    ) AS churn_priority_rank
FROM ranked r;
