from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import create_tables, SessionLocal
from app.models import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    from app.seed_data import seed_demo_data
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, notifications, instruments, laboratories, test_sessions, test_cases, observations, compliance, evidence, reports, review, dashboard, audit, users, rulepacks, system_settings

app.include_router(auth.router)
app.include_router(instruments.router)
app.include_router(laboratories.router)
app.include_router(test_sessions.router)
app.include_router(notifications.router)
app.include_router(test_cases.router)
app.include_router(observations.router)
app.include_router(compliance.router)
app.include_router(evidence.router)
app.include_router(reports.router)
app.include_router(review.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(users.router)
app.include_router(rulepacks.router)
app.include_router(system_settings.router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
