def test_create_party(client):
    response = client.post("/api/v1/parties", json={"name": "  Friday Dinner "})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Friday Dinner"
    assert len(data["join_code"]) == 6
    assert data["id"] > 0
    assert data["created_at"]


def test_create_party_rejects_empty_name(client):
    assert client.post("/api/v1/parties", json={"name": "   "}).status_code == 422
    assert client.post("/api/v1/parties", json={}).status_code == 422
    assert client.post("/api/v1/parties", json={"name": "x" * 101}).status_code == 422


def test_join_codes_are_unique(client):
    codes = {
        client.post("/api/v1/parties", json={"name": f"Party {i}"}).json()["join_code"]
        for i in range(20)
    }
    assert len(codes) == 20


def test_get_party(client):
    created = client.post("/api/v1/parties", json={"name": "Lunch"}).json()
    response = client.get(f"/api/v1/parties/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_get_party_not_found(client):
    response = client.get("/api/v1/parties/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Party not found"}


def test_get_party_by_join_code_is_case_insensitive(client):
    created = client.post("/api/v1/parties", json={"name": "Lunch"}).json()
    response = client.get(f"/api/v1/parties/join/{created['join_code'].lower()}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_invalid_join_code(client):
    response = client.get("/api/v1/parties/join/NOPE00")
    assert response.status_code == 404
    assert response.json() == {"detail": "Invalid join code"}
