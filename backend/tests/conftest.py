from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-scoped FastAPI test client using SQLite in-memory database.

    Overrides DATABASE_URL so tests never touch the real Neon database.
    """
    import os

    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_carevision.db"
    os.environ["GEMMA_API_KEY"] = "test-key-not-real"
    os.environ["GEMMA_MODEL"] = "test-model"

    app = create_app()
    with TestClient(app) as c:
        yield c
