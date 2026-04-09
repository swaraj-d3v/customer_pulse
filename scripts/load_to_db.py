import pandas as pd
import psycopg2

df = pd.read_csv("data/processed/customers_clean.csv")

# Keep only required columns
df = df[[
    "customer_id",
    "tenure_months",
    "mrr",
    "total_revenue",
    "churned",
    "plan",
    "region",
    "industry",
    "signup_date",
    "contract_months",
    "nps_score",
    "csm_owner",
    "churn_date"
]]

# Save clean file
df.to_csv("data/processed/customers_final.csv", index=False)

print("Cleaned file ready ✅")