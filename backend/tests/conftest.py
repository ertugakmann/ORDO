import os

# Tests use a separate database. This must run before the app is imported.
os.environ["DATABASE_URL"] = "postgresql+psycopg://localhost/ordo_test"

import pytest  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from alembic import command  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def migrated_database():
    """Build the test database schema from the Alembic migrations."""
    config = Config("alembic.ini")
    command.downgrade(config, "base")
    command.upgrade(config, "head")


@pytest.fixture()
def db():
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()


@pytest.fixture(autouse=True)
def clean_tables():
    """Empty all tables after each test."""
    yield
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE order_items, orders, participants, menu_items, parties "
                "RESTART IDENTITY CASCADE"
            )
        )


@pytest.fixture()
def client():
    return TestClient(app)
