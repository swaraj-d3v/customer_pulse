import pandas as pd
import numpy as np
from faker import Faker
import os
import uuid
from datetime import datetime, timedelta

print("Script is running...")

fake = Faker("en_IN")
np.random.seed(42)

# -----------------------------
# CREATE FOLDERS IF NOT EXIST
# -----------------------------
os.makedirs("data/processed", exist_ok=True)

# -----------------------------
# LOAD TELCO DATA
# -----------------------------
telco_path = "data/raw/Telco/WA_Fn-UseC_-Telco-Customer-Churn.csv"

df = pd.read_csv(telco_path)

# Rename columns
df = df.rename(columns={
    "customerID": "customer_id",
    "tenure": "tenure_months",
    "MonthlyCharges": "mrr",
    "TotalCharges": "total_revenue",
    "Churn": "churned"
})

# Fix TotalCharges
df["total_revenue"] = pd.to_numeric(df["total_revenue"], errors="coerce").fillna(0)

# Convert churn
df["churned"] = df["churned"].map({"Yes": True, "No": False})

# Plan column
def assign_plan(x):
    if x < 35:
        return "starter"
    elif x < 65:
        return "growth"
    else:
        return "enterprise"

df["plan"] = df["mrr"].apply(assign_plan)

# Region
regions = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune"]
df["region"] = np.random.choice(regions, size=len(df))

# Industry
industries = ["Fintech","Edtech","Healthtech","E-commerce","Logistics","HR Tech","SaaS"]
df["industry"] = np.random.choice(industries, size=len(df))

# Signup date
today = datetime.today()
df["signup_date"] = df["tenure_months"].apply(lambda x: today - timedelta(days=int(x*30)))

# Contract months
def contract_map(x):
    if x == "Month-to-month":
        return 1
    elif x == "One year":
        return 12
    else:
        return 24

df["contract_months"] = df["Contract"].apply(contract_map)

# NPS
df["nps_score"] = np.clip(np.random.normal(30, 40, len(df)), -100, 100).astype(int)

# CSM Owner
owners = ["Priya Sharma","Rahul Mehta","Sneha Iyer","Arjun Nair","Kavya Reddy"]
df["csm_owner"] = np.random.choice(owners, size=len(df))

# Churn date
df["churn_date"] = df.apply(
    lambda row: row["signup_date"] + timedelta(days=int(row["tenure_months"]*30))
    if row["churned"] else pd.NaT,
    axis=1
)

# Save customers
df.to_csv("data/processed/customers_clean.csv", index=False)

print("Customers cleaned:", len(df))

# -----------------------------
# GENERATE EVENTS
# -----------------------------
customers = df["customer_id"].tolist()

event_types = ["login","feature_used","api_call","export","payment_success","payment_failed"]

events = []

for cust in customers:
    num_events = np.random.randint(5, 20)

    for _ in range(num_events):
        event_type = np.random.choice(event_types, p=[0.35,0.25,0.15,0.1,0.1,0.05])

        event = {
            "event_id": str(uuid.uuid4()),
            "customer_id": cust,
            "event_type": event_type,
            "event_date": today - timedelta(days=np.random.randint(0, 365))
        }

        if event_type == "login":
            event["session_duration_mins"] = np.random.uniform(1,120)
        else:
            event["session_duration_mins"] = None

        if event_type == "feature_used":
            event["feature_name"] = np.random.choice(
                ["dashboard","reports","api","integrations","team_mgmt","analytics","exports"]
            )
        else:
            event["feature_name"] = None

        events.append(event)

events_df = pd.DataFrame(events)

# Save events
events_df.to_csv("data/processed/events_clean.csv", index=False)

print("Events generated:", len(events_df))

# -----------------------------
# SUMMARY
# -----------------------------
print("\n--- SUMMARY ---")
print("Total customers:", len(df))
print("Churn rate:", round(df["churned"].mean()*100,2), "%")
print("Total events:", len(events_df))
print("Avg events per customer:", round(len(events_df)/len(df),2))

print("\nData preparation complete ✅")