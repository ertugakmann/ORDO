from decimal import Decimal

import pymupdf
import pytest


def make_pdf(text: str) -> bytes:
    document = pymupdf.open()
    document.new_page().insert_text((50, 72), text, fontsize=11)
    return document.tobytes()


@pytest.fixture()
def setup(client):
    """A confirmed party with two menu items and one participant."""
    party = client.post("/api/v1/parties", json={"name": "Friday Dinner"}).json()
    pdf = make_pdf("STARTERS\nHummus 6.50\nMAIN COURSES\nAdana Kebab 15.00")
    client.post(
        f"/api/v1/parties/{party['id']}/menu/upload",
        files={"file": ("menu.pdf", pdf, "application/pdf")},
    )
    client.post(f"/api/v1/parties/{party['id']}/menu/confirm")
    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    items = {i["name"]: i for c in menu["categories"] for i in c["items"]}
    participant = client.post(
        f"/api/v1/parties/{party['id']}/participants", json={"name": "Ahmet"}
    ).json()
    return {"party": party, "items": items, "participant": participant}


def create_order(client, setup, lines):
    return client.post(
        f"/api/v1/parties/{setup['party']['id']}/orders",
        json={
            "participant_id": setup["participant"]["id"],
            "items": [
                {"menu_item_id": setup["items"][name]["id"], "quantity": quantity}
                for name, quantity in lines
            ],
        },
    )


def test_create_draft_order(client, setup):
    response = create_order(client, setup, [("Adana Kebab", 2), ("Hummus", 1)])
    assert response.status_code == 201
    order = response.json()
    assert order["status"] == "draft"
    assert order["total"] == "36.50"
    assert {i["name"]: i["quantity"] for i in order["items"]} == {
        "Adana Kebab": 2,
        "Hummus": 1,
    }


def test_creating_again_replaces_the_draft(client, setup):
    first = create_order(client, setup, [("Hummus", 1)]).json()
    second = create_order(client, setup, [("Adana Kebab", 3)]).json()
    assert second["id"] == first["id"]
    assert [i["name"] for i in second["items"]] == ["Adana Kebab"]
    orders = client.get(f"/api/v1/parties/{setup['party']['id']}/orders").json()
    assert len(orders) == 1


def test_duplicate_lines_are_added_up(client, setup):
    order = create_order(client, setup, [("Hummus", 1), ("Hummus", 2)]).json()
    assert order["items"][0]["quantity"] == 3


def test_submit_order_snapshots_price(client, setup):
    order = create_order(client, setup, [("Adana Kebab", 2)]).json()
    kebab = setup["items"]["Adana Kebab"]

    # The leader changes the price before the guest submits.
    client.put(
        f"/api/v1/menu-items/{kebab['id']}",
        json={"name": "Adana Kebab", "price": 16, "category": "Main Courses"},
    )
    submitted = client.post(f"/api/v1/orders/{order['id']}/submit").json()
    assert submitted["status"] == "submitted"
    assert submitted["items"][0]["price_snapshot"] == "16.00"
    assert submitted["total"] == "32.00"

    # A later price change does not alter the submitted order.
    client.put(
        f"/api/v1/menu-items/{kebab['id']}",
        json={"name": "Adana Kebab", "price": 20, "category": "Main Courses"},
    )
    saved = client.get(f"/api/v1/orders/{order['id']}").json()
    assert Decimal(saved["total"]) == Decimal("32.00")


def test_cannot_change_or_submit_twice(client, setup):
    order = create_order(client, setup, [("Hummus", 1)]).json()
    client.post(f"/api/v1/orders/{order['id']}/submit")
    assert create_order(client, setup, [("Hummus", 2)]).status_code == 409
    assert client.post(f"/api/v1/orders/{order['id']}/submit").status_code == 409


@pytest.mark.parametrize("quantity", [0, -1, 100])
def test_invalid_quantity(client, setup, quantity):
    assert create_order(client, setup, [("Hummus", quantity)]).status_code == 422


def test_empty_order_is_rejected(client, setup):
    assert create_order(client, setup, []).status_code == 422


def test_item_from_another_party_is_rejected(client, setup):
    other = client.post("/api/v1/parties", json={"name": "Other"}).json()
    response = client.post(
        f"/api/v1/parties/{other['id']}/orders",
        json={
            "participant_id": setup["participant"]["id"],
            "items": [{"menu_item_id": setup["items"]["Hummus"]["id"], "quantity": 1}],
        },
    )
    assert response.status_code == 404  # the participant is in another party


def test_unknown_participant_and_ids(client, setup):
    body = {"participant_id": 999, "items": [{"menu_item_id": 1, "quantity": 1}]}
    party_id = setup["party"]["id"]
    assert (
        client.post(f"/api/v1/parties/{party_id}/orders", json=body).status_code == 404
    )
    assert client.post("/api/v1/parties/999/orders", json=body).status_code == 404
    assert client.get("/api/v1/orders/999").status_code == 404
    assert client.post("/api/v1/orders/999/submit").status_code == 404
    assert client.get("/api/v1/parties/999/orders").status_code == 404


def test_cannot_delete_ordered_menu_item(client, setup):
    create_order(client, setup, [("Hummus", 1)])
    response = client.delete(f"/api/v1/menu-items/{setup['items']['Hummus']['id']}")
    assert response.status_code == 409
