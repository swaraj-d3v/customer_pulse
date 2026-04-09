-- Revenue at risk model
-- ---------------------------------------------
-- This view combines customer health and churn signals with commercial value
-- to estimate:
--   - mrr_at_risk
--   - expected_monthly_loss
--   - prioritization for CSM / revenue interventions

DROP VIEW IF EXISTS revenue_at_risk;

CREATE VIEW revenue_at_risk AS
WITH health AS (
    SELECT
        ch.customer_id,
        ch.health_score,
        ch.risk_tier,
        ch.logins_30d,
        ch.features_30d,
        ch.payments_failed_90d
    FROM customer_health ch
),
signals AS (
    SELECT
        cs.customer_id,
        cs.churn_signal_score,
        cs.churn_risk_band,
        cs.churn_priority_rank,
        cs.sharp_engagement_drop_flag,
        cs.payment_stress_flag,
        cs.inactivity_flag
    FROM churn_signals cs
),
scored AS (
    SELECT
        c.customer_id,
        c.csm_owner,
        c.plan,
        c.region,
        c.industry,
        c.contract_months,
        c.mrr,
        c.total_revenue,
        h.health_score,
        h.risk_tier,
        s.churn_signal_score,
        s.churn_risk_band,
        s.churn_priority_rank,
        s.sharp_engagement_drop_flag,
        s.payment_stress_flag,
        s.inactivity_flag,
        CASE
            WHEN h.risk_tier = 'Critical' THEN c.mrr
            WHEN h.risk_tier = 'At Risk' THEN ROUND(c.mrr * 0.60, 2)
            ELSE 0::numeric
        END AS mrr_at_risk,
        ROUND(
            c.mrr * (
                CASE
                    WHEN h.risk_tier = 'Critical' THEN 0.65
                    WHEN h.risk_tier = 'At Risk' THEN 0.30
                    ELSE 0.08
                END
            )
            * (
                CASE
                    WHEN COALESCE(s.churn_signal_score, 0) >= 60 THEN 1.20
                    WHEN COALESCE(s.churn_signal_score, 0) >= 30 THEN 1.00
                    ELSE 0.70
                END
            ),
            2
        ) AS expected_monthly_loss
    FROM customers c
    LEFT JOIN health h
        ON c.customer_id = h.customer_id
    LEFT JOIN signals s
        ON c.customer_id = s.customer_id
)
SELECT
    s.*,
    CASE
        WHEN s.expected_monthly_loss >= 500 OR (s.mrr >= 500 AND s.risk_tier IN ('Critical', 'At Risk'))
            THEN 'P1'
        WHEN s.expected_monthly_loss >= 200 OR s.risk_tier = 'Critical'
            THEN 'P2'
        ELSE 'P3'
    END AS revenue_priority
FROM scored s
ORDER BY expected_monthly_loss DESC, mrr_at_risk DESC, mrr DESC;
