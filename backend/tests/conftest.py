import os

# Tests use a separate database. This must run before the app is imported.
os.environ["DATABASE_URL"] = "postgresql+psycopg://localhost/ordo_test"

import pytest  # noqa: E402
from alembic.config import Config  # noqa: E402

from alembic import command  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402


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
