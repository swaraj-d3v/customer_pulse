from fastapi import APIRouter, HTTPException

from backend.database import execute_query


router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("/search")
def search_customers(q: str = "", limit: int = 25) -> list[dict]:
    search_term = f"%{q.strip()}%"
    query = """
        SELECT
            customer_id,
            plan,
            region,
            industry,
            csm_owner,
            mrr,
            health_score,
            risk_tier,
            churn_risk_band,
            revenue_priority
        FROM customer_360
        WHERE
            customer_id ILIKE %s
            OR region ILIKE %s
            OR industry ILIKE %s
            OR csm_owner ILIKE %s
            OR plan ILIKE %s
        ORDER BY expected_monthly_loss DESC NULLS LAST, mrr DESC
        LIMIT %s;
    """
    return execute_query(
        query,
        (search_term, search_term, search_term, search_term, search_term, limit),
    )


@router.get("/{customer_id}")
def get_customer(customer_id: str) -> dict:
    query = """
        SELECT *
        FROM customer_360
        WHERE customer_id = %s;
    """
    customer = execute_query(query, (customer_id,), fetch_one=True)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
