from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import close_connection_pool, init_connection_pool
from backend.routers import cohorts, customers, overview, revenue


app = FastAPI(title="CustomerPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router)
app.include_router(customers.router)
app.include_router(cohorts.router)
app.include_router(revenue.router)


@app.on_event("startup")
def on_startup() -> None:
    init_connection_pool()


@app.on_event("shutdown")
def on_shutdown() -> None:
    close_connection_pool()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
