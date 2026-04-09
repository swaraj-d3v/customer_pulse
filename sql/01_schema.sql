CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    gender TEXT,
    "SeniorCitizen" INTEGER NOT NULL,
    "Partner" TEXT,
    "Dependents" TEXT,
    tenure_months INTEGER NOT NULL,
    "PhoneService" TEXT,
    "MultipleLines" TEXT,
    "InternetService" TEXT,
    "OnlineSecurity" TEXT,
    "OnlineBackup" TEXT,
    "DeviceProtection" TEXT,
    "TechSupport" TEXT,
    "StreamingTV" TEXT,
    "StreamingMovies" TEXT,
    "Contract" TEXT,
    "PaperlessBilling" TEXT,
    "PaymentMethod" TEXT,
    mrr NUMERIC(12, 2) NOT NULL,
    total_revenue NUMERIC(14, 2) NOT NULL,
    churned BOOLEAN NOT NULL,
    plan TEXT NOT NULL,
    region TEXT NOT NULL,
    industry TEXT NOT NULL,
    signup_date TIMESTAMP,
    contract_months INTEGER NOT NULL,
    nps_score INTEGER NOT NULL,
    csm_owner TEXT NOT NULL,
    churn_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    session_duration_mins DOUBLE PRECISION,
    feature_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_customers_churned ON customers (churned);
CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers (plan);
CREATE INDEX IF NOT EXISTS idx_customers_region ON customers (region);
CREATE INDEX IF NOT EXISTS idx_customers_signup_date ON customers (signup_date);

CREATE INDEX IF NOT EXISTS idx_events_customer_id ON events (customer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_customer_date ON events (customer_id, event_date);
