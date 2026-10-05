from decimal import Decimal

from app.models import MenuItem, Order, OrderItem, Participant, Party


def test_party_with_menu_and_order(db):
    party = Party(name="Friday Dinner", join_code="ABX72K")
    kebab = MenuItem(
        name="Adana Kebab", price=Decimal("15.00"), category="Main Courses"
    )
    ahmet = Participant(name="Ahmet")
    party.menu_items.append(kebab)
    party.participants.append(ahmet)
    db.add(party)
    db.flush()

    order = Order(party_id=party.id, participant_id=ahmet.id)
    order.items.append(
        OrderItem(menu_item_id=kebab.id, quantity=2, price_snapshot=kebab.price)
    )
    db.add(order)
    db.flush()
    db.refresh(order)

    assert order.status == "draft"
    assert order.created_at is not None
    assert order.items[0].price_snapshot == Decimal("15.00")
    assert party.orders == [order]
    assert party.menu_items[0].description is None
