from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.db.session import get_db
from app.main import app


def test_unknown_route_returns_json_404():
    client = TestClient(app)
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}


def test_database_error_returns_json_500():
    class BrokenSession:
        def execute(self, *args, **kwargs):
            raise OperationalError("SELECT 1", {}, Exception("db down"))

    app.dependency_overrides[get_db] = lambda: BrokenSession()
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/health")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json() == {"detail": "Database error"}
