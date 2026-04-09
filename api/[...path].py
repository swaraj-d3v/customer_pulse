from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.database import execute_query


app = FastAPI(title="CustomerPulse Vercel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/overview/kpis")
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


@app.get("/api/overview/top-at-risk")
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


@app.get("/api/customers/search")
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


@app.get("/api/customers/{customer_id}")
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


@app.get("/api/cohorts/retention-matrix")
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


@app.get("/api/cohorts/plan-analysis")
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


@app.get("/api/revenue/at-risk-summary")
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


@app.get("/api/revenue/priority-list")
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
