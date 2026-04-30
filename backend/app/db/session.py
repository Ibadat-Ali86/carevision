from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.db.models import Base

# WHY async engine: all FastAPI route handlers are async def. Mixing sync SQLAlchemy
# in async context causes blocking I/O that defeats uvloop performance gains.
#
# WHY connect_args ssl=True: asyncpg does NOT accept `sslmode` as a URL query
# parameter (that is libpq/psycopg2 syntax). Neon requires TLS; we satisfy this
# by passing ssl=True through connect_args instead of the URL. The DATABASE_URL
# must NOT contain ?sslmode=require — asyncpg will reject it as an unknown kwarg.
engine = create_async_engine(
    settings.database_url,
    connect_args={"ssl": True},
    # pool_size and max_overflow only apply to PostgreSQL (asyncpg).
    # SQLite (aiosqlite) uses a single connection — pool args are ignored.
    echo=settings.environment == "development",
)

AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Create all tables on startup if they do not exist.

    Called once from the FastAPI lifespan context manager in main.py.
    In production, Alembic handles migrations; this call is a safety net
    for development and CI where the DB starts empty.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a per-request async database session.

    Usage in route handlers:
        async def my_route(db: AsyncSession = Depends(get_session)):
            ...

    The session is committed by the route handler before yielding control back.
    The finally block ensures the session is always closed, even on exception.
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
        finally:
            await session.close()
