import pytest


@pytest.fixture()
def party(client):
    return client.post("/api/v1/parties", json={"name": "Friday Dinner"}).json()


def add_item(client, party, **overrides):
    data = {
        "name": "Hummus",
        "description": "Chickpea, tahini, lemon",
        "price": 6.5,
        "category": "Starters",
    }
    data.update(overrides)
    return client.post(f"/api/v1/parties/{party['id']}/menu-items", json=data)


def test_empty_menu(client, party):
    response = client.get(f"/api/v1/parties/{party['id']}/menu")
    assert response.status_code == 200
    assert response.json() == {"categories": []}


def test_add_item_and_group_by_category(client, party):
    assert add_item(client, party).status_code == 201
    add_item(client, party, name="Adana Kebab", price=15, category="Main Courses")
    add_item(client, party, name="Lahmacun", price=5.5)

    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    assert [c["name"] for c in menu["categories"]] == ["Starters", "Main Courses"]
    starters = menu["categories"][0]["items"]
    assert [i["name"] for i in starters] == ["Hummus", "Lahmacun"]
    assert starters[0]["price"] == "6.50"


def test_update_item_including_category(client, party):
    item = add_item(client, party).json()
    response = client.put(
        f"/api/v1/menu-items/{item['id']}",
        json={"name": "Humus", "description": None, "price": 7, "category": "Sides"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Humus"
    assert response.json()["category"] == "Sides"
    assert response.json()["description"] is None
    assert response.json()["price"] == "7.00"


def test_delete_item(client, party):
    item = add_item(client, party).json()
    assert client.delete(f"/api/v1/menu-items/{item['id']}").status_code == 204
    menu = client.get(f"/api/v1/parties/{party['id']}/menu").json()
    assert menu == {"categories": []}


def test_not_found(client, party):
    assert client.get("/api/v1/parties/999/menu").status_code == 404
    assert add_item(client, {"id": 999}).status_code == 404
    assert client.delete("/api/v1/menu-items/999").json() == {
        "detail": "Menu item not found"
    }
    body = {"name": "A", "price": 1, "category": "B"}
    assert client.put("/api/v1/menu-items/999", json=body).status_code == 404


@pytest.mark.parametrize(
    "overrides",
    [
        {"name": ""},
        {"name": "x" * 101},
        {"price": -1},
        {"price": 10000},
        {"price": 1.234},
        {"price": "abc"},
        {"category": " "},
        {"description": "x" * 501},
    ],
)
def test_invalid_item_is_rejected(client, party, overrides):
    assert add_item(client, party, **overrides).status_code == 422
