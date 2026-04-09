-- Cohort retention analysis
-- ---------------------------------------------
-- This view cohorts customers by signup month and measures whether they
-- generated at least one event in later lifecycle months.
--
-- Retention definition:
--   A customer is retained in month N if they produced any event during the
--   Nth month since their signup month.

DROP VIEW IF EXISTS cohort_retention;

CREATE VIEW cohort_retention AS
WITH customer_cohorts AS (
    SELECT
        c.customer_id,
        DATE_TRUNC('month', c.signup_date)::date AS cohort_month
    FROM customers c
    WHERE c.signup_date IS NOT NULL
),
customer_activity AS (
    SELECT DISTINCT
        cc.customer_id,
        cc.cohort_month,
        (
            (DATE_PART('year', AGE(DATE_TRUNC('month', e.event_date), cc.cohort_month)) * 12)
            + DATE_PART('month', AGE(DATE_TRUNC('month', e.event_date), cc.cohort_month))
        )::integer AS month_number
    FROM customer_cohorts cc
    JOIN events e
        ON e.customer_id = cc.customer_id
       AND e.event_date >= cc.cohort_month
),
cohort_sizes AS (
    SELECT
        cohort_month,
        COUNT(*) AS cohort_size
    FROM customer_cohorts
    GROUP BY cohort_month
),
retention_counts AS (
    SELECT
        ca.cohort_month,
        ca.month_number,
        COUNT(DISTINCT ca.customer_id) AS retained_customers
    FROM customer_activity ca
    WHERE ca.month_number BETWEEN 0 AND 12
    GROUP BY ca.cohort_month, ca.month_number
)
SELECT
    cs.cohort_month,
    cs.cohort_size,
    COALESCE(MAX(CASE WHEN rc.month_number = 0 THEN rc.retained_customers END), 0) AS retained_month_0,
    COALESCE(MAX(CASE WHEN rc.month_number = 1 THEN rc.retained_customers END), 0) AS retained_month_1,
    COALESCE(MAX(CASE WHEN rc.month_number = 3 THEN rc.retained_customers END), 0) AS retained_month_3,
    COALESCE(MAX(CASE WHEN rc.month_number = 6 THEN rc.retained_customers END), 0) AS retained_month_6,
    COALESCE(MAX(CASE WHEN rc.month_number = 12 THEN rc.retained_customers END), 0) AS retained_month_12,
    ROUND(
        100.0 * COALESCE(MAX(CASE WHEN rc.month_number = 0 THEN rc.retained_customers END), 0) / NULLIF(cs.cohort_size, 0),
        2
    ) AS retention_month_0_pct,
    ROUND(
        100.0 * COALESCE(MAX(CASE WHEN rc.month_number = 1 THEN rc.retained_customers END), 0) / NULLIF(cs.cohort_size, 0),
        2
    ) AS retention_month_1_pct,
    ROUND(
        100.0 * COALESCE(MAX(CASE WHEN rc.month_number = 3 THEN rc.retained_customers END), 0) / NULLIF(cs.cohort_size, 0),
        2
    ) AS retention_month_3_pct,
    ROUND(
        100.0 * COALESCE(MAX(CASE WHEN rc.month_number = 6 THEN rc.retained_customers END), 0) / NULLIF(cs.cohort_size, 0),
        2
    ) AS retention_month_6_pct,
    ROUND(
        100.0 * COALESCE(MAX(CASE WHEN rc.month_number = 12 THEN rc.retained_customers END), 0) / NULLIF(cs.cohort_size, 0),
        2
    ) AS retention_month_12_pct
FROM cohort_sizes cs
LEFT JOIN retention_counts rc
    ON cs.cohort_month = rc.cohort_month
GROUP BY cs.cohort_month, cs.cohort_size
ORDER BY cs.cohort_month;
