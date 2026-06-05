from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from app.core.config import settings
from app.db.database import init_db
from app.api.routes import exams, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database ready. Booting GradeOps AI Engine...")
    yield
    logger.info("Shutting down GradeOps...")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(exams.router, prefix="/api", tags=["Exams & Grading"])

@app.get("/health")
async def health_check():
    """Sanity check endpoint to ensure the API is alive"""
    return {
        "status": "online", 
        "project": settings.PROJECT_NAME,
        "database": "connected, async mode"
    }