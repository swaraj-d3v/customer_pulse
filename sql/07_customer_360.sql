-- Customer 360 view
-- ---------------------------------------------
-- Unified analytic view with:
--   - account profile
--   - recent product usage
--   - payment signals
--   - health scoring
--   - churn indicators
--   - revenue risk context
--
-- This view is intended to support customer drill-down pages, CSM workflows,
-- and downstream API endpoints.

DROP VIEW IF EXISTS customer_360;

CREATE VIEW customer_360 AS
WITH event_rollup AS (
    SELECT
        e.customer_id,
        COUNT(*) AS lifetime_events,
        COUNT(*) FILTER (WHERE e.event_type = 'login') AS lifetime_logins,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used') AS lifetime_feature_events,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_success') AS lifetime_payment_success,
        COUNT(*) FILTER (WHERE e.event_type = 'payment_failed') AS lifetime_payment_failed,
        COUNT(*) FILTER (WHERE e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS events_30d,
        COUNT(*) FILTER (WHERE e.event_type = 'login'
                         AND e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS logins_30d,
        COUNT(*) FILTER (WHERE e.event_type = 'feature_used'
                         AND e.event_date >= CURRENT_DATE - INTERVAL '30 day') AS features_30d,
        MAX(e.event_date) AS last_event_at
    FROM events e
    GROUP BY e.customer_id
),
feature_adoption AS (
    -- Distinct feature count is a compact proxy for breadth of adoption.
    SELECT
        e.customer_id,
        COUNT(DISTINCT e.feature_name) FILTER (WHERE e.event_type = 'feature_used') AS distinct_features_used
    FROM events e
    GROUP BY e.customer_id
)
SELECT
    c.customer_id,
    c.gender,
    c."SeniorCitizen",
    c."Partner",
    c."Dependents",
    c.tenure_months,
    c."PhoneService",
    c."MultipleLines",
    c."InternetService",
    c."OnlineSecurity",
    c."OnlineBackup",
    c."DeviceProtection",
    c."TechSupport",
    c."StreamingTV",
    c."StreamingMovies",
    c."Contract",
    c."PaperlessBilling",
    c."PaymentMethod",
    c.plan,
    c.region,
    c.industry,
    c.signup_date,
    c.contract_months,
    c.nps_score,
    c.csm_owner,
    c.mrr,
    c.total_revenue,
    c.churned,
    c.churn_date,
    er.lifetime_events,
    er.lifetime_logins,
    er.lifetime_feature_events,
    er.lifetime_payment_success,
    er.lifetime_payment_failed,
    er.events_30d,
    er.logins_30d,
    er.features_30d,
    er.last_event_at,
    fa.distinct_features_used,
    ch.health_score,
    ch.risk_tier,
    ch.login_trend_pct,
    ch.feature_trend_pct,
    cs.churn_signal_score,
    cs.churn_risk_band,
    cs.churn_priority_rank,
    cs.sharp_engagement_drop_flag,
    cs.payment_stress_flag,
    cs.inactivity_flag,
    rr.mrr_at_risk,
    rr.expected_monthly_loss,
    rr.revenue_priority
FROM customers c
LEFT JOIN event_rollup er
    ON c.customer_id = er.customer_id
LEFT JOIN feature_adoption fa
    ON c.customer_id = fa.customer_id
LEFT JOIN customer_health ch
    ON c.customer_id = ch.customer_id
LEFT JOIN churn_signals cs
    ON c.customer_id = cs.customer_id
LEFT JOIN revenue_at_risk rr
    ON c.customer_id = rr.customer_id;
