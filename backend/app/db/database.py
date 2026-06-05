import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure we are using the asyncpg driver for NeonDB
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create the async engine
engine = create_async_engine(
    database_url,
    echo=False,          
    pool_pre_ping=True,  # Prevents dropped connections
)

# Create the async session factory
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    """Dependency to generate an async database session for a single request."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def init_db():
    """Creates tables asynchronously on startup."""
    from app.db import models
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
        logger.info("Database tables verified / created.")