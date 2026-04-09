import os
from contextlib import contextmanager
from decimal import Decimal
from typing import Any

from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool


def _normalize_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")

    if database_url.startswith("postgresql+psycopg2://"):
        return database_url.replace("postgresql+psycopg2://", "postgresql://", 1)

    return database_url


connection_pool: SimpleConnectionPool | None = None


def init_connection_pool() -> None:
    global connection_pool
    if connection_pool is None:
        connection_pool = SimpleConnectionPool(minconn=1, maxconn=10, dsn=_normalize_database_url())


def close_connection_pool() -> None:
    global connection_pool
    if connection_pool is not None:
        connection_pool.closeall()
        connection_pool = None


@contextmanager
def get_connection():
    init_connection_pool()
    if connection_pool is None:
        raise RuntimeError("Database connection pool is not initialized.")

    connection = connection_pool.getconn()
    try:
        yield connection
    finally:
        connection_pool.putconn(connection)


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: _json_safe(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def execute_query(query: str, params: tuple[Any, ...] | None = None, fetch_one: bool = False) -> Any:
    with get_connection() as connection:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)

            if cursor.description is None:
                connection.commit()
                return None

            result = cursor.fetchone() if fetch_one else cursor.fetchall()
            return _json_safe(result)
