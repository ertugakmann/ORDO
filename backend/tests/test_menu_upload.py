import fitz
import pytest

from app.api.v1 import menu as menu_routes


def make_pdf(text: str) -> bytes:
    document = fitz.open()
    document.new_page().insert_text((50, 72), text, fontsize=11)
    return document.tobytes()


@pytest.fixture()
def party(client):
    return client.post("/api/v1/parties", json={"name": "Friday Dinner"}).json()


def upload(client, party, content, filename="menu.pdf"):
    return client.post(
        f"/api/v1/parties/{party['id']}/menu/upload",
        files={"file": (filename, content, "application/pdf")},
    )


def test_upload_menu_saves_parsed_items(client, party):
    pdf = make_pdf("STARTERS\nHummus £6.50\nMAIN COURSES\nAdana Kebab £15.00")
    response = upload(client, party, pdf)
    assert response.status_code == 200
    categories = response.json()["categories"]
    assert [c["name"] for c in categories] == ["Starters", "Main Courses"]
    assert categories[1]["items"][0]["price"] == "15.00"

    saved = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    assert saved == response.json()


def test_upload_replaces_previous_menu(client, party):
    upload(client, party, make_pdf("Hummus 6.50"))
    upload(client, party, make_pdf("Falafel 5.00"))
    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    names = [i["name"] for c in menu["categories"] for i in c["items"]]
    assert names == ["Falafel"]


def test_failed_upload_keeps_existing_menu(client, party):
    upload(client, party, make_pdf("Hummus 6.50"))
    upload(client, party, make_pdf("No prices here"))
    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    assert menu["categories"][0]["items"][0]["name"] == "Hummus"


def test_rejects_non_pdf_extension(client, party):
    response = upload(client, party, make_pdf("Hummus 6.50"), filename="menu.txt")
    assert response.status_code == 400


def test_rejects_file_that_is_not_a_pdf(client, party):
    response = upload(client, party, b"just some text", filename="menu.pdf")
    assert response.status_code == 400
    assert response.json() == {"detail": "Please upload a PDF file"}


def test_rejects_large_file(client, party, monkeypatch):
    monkeypatch.setattr(menu_routes, "MAX_PDF_SIZE", 100)
    response = upload(client, party, b"%PDF" + b"0" * 200)
    assert response.status_code == 413


def test_unparseable_pdf(client, party):
    response = upload(client, party, b"%PDF-1.4 broken")
    assert response.status_code == 422
    assert response.json() == {"detail": "Unable to parse this PDF."}


def test_pdf_without_menu_items(client, party):
    response = upload(client, party, make_pdf("Welcome to our restaurant"))
    assert response.status_code == 422
    assert response.json() == {"detail": "No menu items found."}


def test_upload_for_unknown_party(client):
    response = upload(client, {"id": 999}, make_pdf("Hummus 6.50"))
    assert response.status_code == 404


def test_confirm_menu(client, party):
    assert party["menu_confirmed"] is False
    upload(client, party, make_pdf("Hummus 6.50"))

    response = client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    assert response.status_code == 200
    assert response.json()["menu_confirmed"] is True

    by_code = client.get(f"/api/v1/parties/join/{party['join_code']}").json()
    assert by_code["menu_confirmed"] is True


def test_cannot_confirm_empty_menu(client, party):
    response = client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    assert response.status_code == 422
    assert (
        client.get(f"/api/v1/parties/{party['id']}").json()["menu_confirmed"] is False
    )


def test_confirm_unknown_party(client):
    assert client.post("/api/v1/parties/999/menu/confirm").status_code == 404


def test_cannot_upload_after_confirming(client, party):
    upload(client, party, make_pdf("Hummus 6.50"))
    client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    response = upload(client, party, make_pdf("Falafel 5.00"))
    assert response.status_code == 409
