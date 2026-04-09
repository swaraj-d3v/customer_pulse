from fastapi import APIRouter

from backend.database import execute_query


router = APIRouter(prefix="/api/overview", tags=["overview"])


@router.get("/kpis")
def get_kpis() -> dict:
    query = """
        WITH latest_retention AS (
            SELECT retention_month_1_pct
            FROM cohort_retention
            ORDER BY cohort_month DESC
            LIMIT 1
        )
        SELECT
            COUNT(*) AS total_customers,
            ROUND(COALESCE(SUM(mrr), 0), 2) AS total_mrr,
            ROUND(COALESCE(AVG(health_score), 0), 2) AS avg_health_score,
            COUNT(*) FILTER (WHERE risk_tier = 'At Risk') AS at_risk_customers,
            COUNT(*) FILTER (WHERE risk_tier = 'Critical') AS critical_customers,
            ROUND(COALESCE(SUM(mrr_at_risk), 0), 2) AS mrr_at_risk,
            ROUND(COALESCE(SUM(expected_monthly_loss), 0), 2) AS expected_monthly_loss,
            COALESCE((SELECT retention_month_1_pct FROM latest_retention), 0) AS latest_month_1_retention_pct
        FROM revenue_at_risk;
    """
    return execute_query(query, fetch_one=True)


@router.get("/top-at-risk")
def get_top_at_risk(limit: int = 10) -> list[dict]:
    query = """
        SELECT
            customer_id,
            plan,
            region,
            csm_owner,
            mrr,
            health_score,
            risk_tier,
            churn_signal_score,
            expected_monthly_loss,
            revenue_priority
        FROM revenue_at_risk
        ORDER BY expected_monthly_loss DESC, churn_signal_score DESC, mrr DESC
        LIMIT %s;
    """
    return execute_query(query, (limit,))
