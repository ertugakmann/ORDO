import pymupdf
import pytest


def make_pdf(text: str) -> bytes:
    document = pymupdf.open()
    document.new_page().insert_text((50, 72), text, fontsize=11)
    return document.tobytes()


@pytest.fixture()
def party(client):
    """A confirmed party: Hummus 6.50, Adana Kebab 15.00, Coke 2.50."""
    party = client.post("/api/v1/parties", json={"name": "Friday Dinner"}).json()
    pdf = make_pdf(
        "STARTERS\nHummus 6.50\nMAIN COURSES\nAdana Kebab 15.00\nDRINKS\nCoke 2.50"
    )
    client.post(
        f"/api/v1/parties/{party['id']}/menu/upload",
        files={"file": ("menu.pdf", pdf, "application/pdf")},
    )
    client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    party["items"] = {i["name"]: i for c in menu["categories"] for i in c["items"]}
    return party


def join(client, party, name, lines=None, submit=True):
    """Add a guest. If lines are given, they order (and submit) them."""
    guest = client.post(
        f"/api/v1/parties/{party['id']}/participants", json={"name": name}
    ).json()
    if lines:
        order = client.post(
            f"/api/v1/parties/{party['id']}/orders",
            json={
                "participant_id": guest["id"],
                "items": [
                    {"menu_item_id": party["items"][n]["id"], "quantity": q}
                    for n, q in lines
                ],
            },
        ).json()
        if submit:
            client.post(f"/api/v1/orders/{order['id']}/submit")
    return guest


def test_dashboard_with_no_participants(client, party):
    data = client.get(f"/api/v1/parties/{party['id']}/dashboard").json()
    assert data["party_name"] == "Friday Dinner"
    assert data["participants"] == []
    assert data["group_total"] == "0"


def test_dashboard_status_items_and_totals(client, party):
    join(client, party, "Ahmet", [("Adana Kebab", 2), ("Hummus", 1)])
    join(client, party, "Mehmet", [("Coke", 4)])
    join(client, party, "Ertug")  # has not ordered
    join(client, party, "Ayse", [("Hummus", 1)], submit=False)  # draft only

    data = client.get(f"/api/v1/parties/{party['id']}/dashboard").json()
    people = {p["name"]: p for p in data["participants"]}

    assert people["Ahmet"]["status"] == "submitted"
    assert people["Ahmet"]["total"] == "36.50"
    assert {i["name"]: i["quantity"] for i in people["Ahmet"]["items"]} == {
        "Adana Kebab": 2,
        "Hummus": 1,
    }
    assert people["Mehmet"]["total"] == "10.00"
    assert people["Ertug"]["status"] == "not_submitted"
    assert people["Ertug"]["items"] == []
    assert people["Ayse"]["status"] == "not_submitted"
    assert people["Ayse"]["total"] == "0"
    assert data["group_total"] == "46.50"


def test_consolidated_order(client, party):
    join(client, party, "Ahmet", [("Adana Kebab", 2), ("Hummus", 1)])
    join(client, party, "Mehmet", [("Adana Kebab", 3), ("Coke", 4)])
    join(client, party, "Ayse", [("Hummus", 5)], submit=False)

    data = client.get(f"/api/v1/parties/{party['id']}/consolidated-order").json()
    rows = [(i["name"], i["quantity"], i["total"]) for i in data["items"]]
    assert rows == [
        ("Hummus", 1, "6.50"),
        ("Adana Kebab", 5, "75.00"),
        ("Coke", 4, "10.00"),
    ]
    assert data["total_quantity"] == 10
    assert data["total"] == "91.50"


def test_consolidated_order_is_empty_without_orders(client, party):
    data = client.get(f"/api/v1/parties/{party['id']}/consolidated-order").json()
    assert data == {"items": [], "total_quantity": 0, "total": "0"}


def test_unknown_party(client):
    assert client.get("/api/v1/parties/999/dashboard").status_code == 404
    assert client.get("/api/v1/parties/999/consolidated-order").status_code == 404
