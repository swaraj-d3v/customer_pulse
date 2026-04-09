from fastapi import APIRouter

from backend.database import execute_query


router = APIRouter(prefix="/api/cohorts", tags=["cohorts"])


@router.get("/retention-matrix")
def get_retention_matrix() -> list[dict]:
    query = """
        SELECT
            cohort_month,
            cohort_size,
            retention_month_0_pct,
            retention_month_1_pct,
            retention_month_3_pct,
            retention_month_6_pct,
            retention_month_12_pct
        FROM cohort_retention
        ORDER BY cohort_month;
    """
    return execute_query(query)


@router.get("/plan-analysis")
def get_plan_analysis() -> list[dict]:
    query = """
        SELECT
            plan,
            COUNT(*) AS customer_count,
            ROUND(COALESCE(SUM(mrr), 0), 2) AS total_mrr,
            ROUND(COALESCE(AVG(health_score), 0), 2) AS avg_health_score,
            ROUND(COALESCE(AVG(churn_signal_score), 0), 2) AS avg_churn_signal_score,
            COUNT(*) FILTER (WHERE risk_tier = 'Healthy') AS healthy_customers,
            COUNT(*) FILTER (WHERE risk_tier = 'At Risk') AS at_risk_customers,
            COUNT(*) FILTER (WHERE risk_tier = 'Critical') AS critical_customers,
            ROUND(COALESCE(SUM(mrr_at_risk), 0), 2) AS mrr_at_risk
        FROM revenue_at_risk
        GROUP BY plan
        ORDER BY total_mrr DESC, customer_count DESC;
    """
    return execute_query(query)
