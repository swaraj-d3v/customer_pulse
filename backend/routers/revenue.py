from fastapi import APIRouter

from backend.database import execute_query


router = APIRouter(prefix="/api/revenue", tags=["revenue"])


@router.get("/at-risk-summary")
def get_at_risk_summary() -> dict:
    query = """
        SELECT
            ROUND(COALESCE(SUM(mrr), 0), 2) AS total_mrr,
            ROUND(COALESCE(SUM(mrr_at_risk), 0), 2) AS total_mrr_at_risk,
            ROUND(COALESCE(SUM(expected_monthly_loss), 0), 2) AS total_expected_monthly_loss,
            COUNT(*) FILTER (WHERE revenue_priority = 'P1') AS priority_p1_customers,
            COUNT(*) FILTER (WHERE revenue_priority = 'P2') AS priority_p2_customers,
            COUNT(*) FILTER (WHERE revenue_priority = 'P3') AS priority_p3_customers
        FROM revenue_at_risk;
    """
    return execute_query(query, fetch_one=True)


@router.get("/priority-list")
def get_priority_list(limit: int = 25) -> list[dict]:
    query = """
        SELECT
            customer_id,
            csm_owner,
            plan,
            region,
            industry,
            mrr,
            risk_tier,
            churn_risk_band,
            mrr_at_risk,
            expected_monthly_loss,
            revenue_priority,
            churn_priority_rank
        FROM revenue_at_risk
        ORDER BY
            CASE revenue_priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
            expected_monthly_loss DESC,
            churn_priority_rank ASC NULLS LAST
        LIMIT %s;
    """
    return execute_query(query, (limit,))
