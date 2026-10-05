import pymupdf
import pytest


def make_pdf(text: str) -> bytes:
    document = pymupdf.open()
    document.new_page().insert_text((50, 72), text, fontsize=11)
    return document.tobytes()


@pytest.fixture()
def party(client):
    """A party whose menu is confirmed."""
    party = client.post("/api/v1/parties", json={"name": "Friday Dinner"}).json()
    client.post(
        f"/api/v1/parties/{party['id']}/menu/upload",
        files={"file": ("menu.pdf", make_pdf("Hummus 6.50"), "application/pdf")},
    )
    client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    return party


def test_join_party(client, party):
    response = client.post(
        f"/api/v1/parties/{party['id']}/participants", json={"name": " Ahmet "}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Ahmet"
    assert response.json()["party_id"] == party["id"]


def test_list_participants(client, party):
    for name in ["Ahmet", "Mehmet"]:
        client.post(f"/api/v1/parties/{party['id']}/participants", json={"name": name})
    response = client.get(f"/api/v1/parties/{party['id']}/participants")
    assert [p["name"] for p in response.json()] == ["Ahmet", "Mehmet"]


@pytest.mark.parametrize("name", ["", "   ", "x" * 51])
def test_invalid_name(client, party, name):
    response = client.post(
        f"/api/v1/parties/{party['id']}/participants", json={"name": name}
    )
    assert response.status_code == 422


def test_cannot_join_before_menu_is_confirmed(client):
    party = client.post("/api/v1/parties", json={"name": "Lunch"}).json()
    response = client.post(
        f"/api/v1/parties/{party['id']}/participants", json={"name": "Ahmet"}
    )
    assert response.status_code == 409
    assert response.json() == {"detail": "The menu is not ready yet"}


def test_unknown_party(client):
    assert (
        client.post("/api/v1/parties/999/participants", json={"name": "A"}).status_code
        == 404
    )
    assert client.get("/api/v1/parties/999/participants").status_code == 404
