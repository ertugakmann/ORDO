from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError
from app.models import MenuItem, Order, OrderItem, Participant, Party
from app.schemas.order import OrderItemInput, OrderItemRead, OrderRead


def order_to_read(order: Order) -> OrderRead:
    items = [
        OrderItemRead(
            menu_item_id=item.menu_item_id,
            name=item.menu_item.name,
            quantity=item.quantity,
            price_snapshot=item.price_snapshot,
            line_total=item.price_snapshot * item.quantity,
        )
        for item in order.items
    ]
    return OrderRead(
        id=order.id,
        party_id=order.party_id,
        participant_id=order.participant_id,
        status=order.status,
        created_at=order.created_at,
        items=items,
        total=sum((item.line_total for item in items), start=0),
    )


def get_order(db: Session, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise AppError(404, "Order not found")
    return order


def list_orders(db: Session, party_id: int) -> list[Order]:
    return list(
        db.scalars(
            select(Order)
            .where(Order.party_id == party_id)
            .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
            .order_by(Order.id)
        )
    )


def create_draft_order(
    db: Session, party: Party, participant_id: int, inputs: list[OrderItemInput]
) -> Order:
    """Create the participant's draft order, or replace the items of the old one."""
    if not party.menu_confirmed:
        raise AppError(409, "The menu is not ready yet")

    participant = db.get(Participant, participant_id)
    if participant is None or participant.party_id != party.id:
        raise AppError(404, "Participant not found")

    # Add up quantities if the same item appears twice.
    quantities: dict[int, int] = {}
    for item in inputs:
        quantities[item.menu_item_id] = (
            quantities.get(item.menu_item_id, 0) + item.quantity
        )

    menu_items = db.scalars(
        select(MenuItem).where(
            MenuItem.party_id == party.id, MenuItem.id.in_(quantities)
        )
    ).all()
    if len(menu_items) != len(quantities):
        raise AppError(422, "Some items are not on this menu")
    if any(quantity > 99 for quantity in quantities.values()):
        raise AppError(422, "Quantity is too large")

    order = db.scalar(select(Order).where(Order.participant_id == participant_id))
    if order is None:
        order = Order(party_id=party.id, participant_id=participant_id)
        db.add(order)
    elif order.status == "submitted":
        raise AppError(409, "This order has already been submitted")
    else:
        order.items.clear()

    for menu_item in menu_items:
        order.items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                quantity=quantities[menu_item.id],
                price_snapshot=menu_item.price,
            )
        )
    db.commit()
    db.refresh(order)
    return order


def submit_order(db: Session, order: Order) -> Order:
    if order.status == "submitted":
        raise AppError(409, "This order has already been submitted")

    # Store the price at the moment of submission.
    for item in order.items:
        item.price_snapshot = item.menu_item.price
    order.status = "submitted"
    db.commit()
    db.refresh(order)
    return order
