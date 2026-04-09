import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CUSTOMERS_CSV = PROJECT_ROOT / "data" / "processed" / "customers_clean.csv"
EVENTS_CSV = PROJECT_ROOT / "data" / "processed" / "events_clean.csv"
SCHEMA_SQL = PROJECT_ROOT / "sql" / "01_schema.sql"


def get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set. Copy .env.example and provide a PostgreSQL connection string.")

    # Accept common platform-provided URLs and normalize them for SQLAlchemy.
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg2://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return database_url


def create_db_engine() -> Engine:
    return create_engine(
        get_database_url(),
        future=True,
        pool_pre_ping=True,
    )


def ensure_required_files() -> None:
    required_files = [CUSTOMERS_CSV, EVENTS_CSV, SCHEMA_SQL]
    missing = [str(path) for path in required_files if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing required file(s): {', '.join(missing)}")


def apply_schema(engine: Engine) -> None:
    schema_sql = SCHEMA_SQL.read_text(encoding="utf-8")
    with engine.begin() as connection:
        connection.execute(text(schema_sql))


def clear_existing_data(engine: Engine) -> None:
    with engine.begin() as connection:
        connection.execute(text("DELETE FROM events"))
        connection.execute(text("DELETE FROM customers"))


def load_customers(engine: Engine) -> int:
    df = pd.read_csv(
        CUSTOMERS_CSV,
        parse_dates=["signup_date", "churn_date"],
    )
    df["churned"] = (
        df["churned"]
        .astype(str)
        .str.strip()
        .str.lower()
        .map({"true": True, "false": False, "1": True, "0": False})
    )
    df.to_sql("customers", con=engine, if_exists="append", index=False, method="multi", chunksize=1000)
    return len(df)


def load_events(engine: Engine) -> int:
    total_rows = 0
    for chunk in pd.read_csv(EVENTS_CSV, parse_dates=["event_date"], chunksize=10000):
        chunk.to_sql("events", con=engine, if_exists="append", index=False, method="multi", chunksize=1000)
        total_rows += len(chunk)
    return total_rows


def fetch_row_count(engine: Engine, table_name: str) -> int:
    with engine.begin() as connection:
        return connection.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one()


def main() -> None:
    ensure_required_files()
    engine = create_db_engine()
    try:
        apply_schema(engine)
        clear_existing_data(engine)

        inserted_customers = load_customers(engine)
        inserted_events = load_events(engine)

        db_customers = fetch_row_count(engine, "customers")
        db_events = fetch_row_count(engine, "events")

        print(f"Loaded customers: {inserted_customers} rows")
        print(f"Loaded events: {inserted_events} rows")
        print(f"Database customers count: {db_customers}")
        print(f"Database events count: {db_events}")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
