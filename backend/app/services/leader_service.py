from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import MenuItem, Party
from app.schemas.leader import (
    ConsolidatedItem,
    ConsolidatedOrder,
    Dashboard,
    DashboardParticipant,
)
from app.services import order_service, participant_service


def get_submitted_orders(db: Session, party_id: int):
    orders = order_service.list_orders(db, party_id)
    return [order_service.order_to_read(o) for o in orders if o.status == "submitted"]


def get_dashboard(db: Session, party: Party) -> Dashboard:
    submitted = {o.participant_id: o for o in get_submitted_orders(db, party.id)}

    participants = []
    for participant in participant_service.list_participants(db, party.id):
        order = submitted.get(participant.id)
        participants.append(
            DashboardParticipant(
                id=participant.id,
                name=participant.name,
                status="submitted" if order else "not_submitted",
                items=order.items if order else [],
                total=order.total if order else Decimal("0"),
            )
        )

    return Dashboard(
        party_id=party.id,
        party_name=party.name,
        participants=participants,
        group_total=sum((p.total for p in participants), start=Decimal("0")),
    )


def get_consolidated_order(db: Session, party_id: int) -> ConsolidatedOrder:
    """Add up the submitted orders into one list for the restaurant."""
    lines: dict[int, ConsolidatedItem] = {}
    for order in get_submitted_orders(db, party_id):
        for item in order.items:
            if item.menu_item_id not in lines:
                menu_item = db.get(MenuItem, item.menu_item_id)
                lines[item.menu_item_id] = ConsolidatedItem(
                    menu_item_id=item.menu_item_id,
                    name=item.name,
                    category=menu_item.category,
                    quantity=0,
                    total=Decimal("0"),
                )
            line = lines[item.menu_item_id]
            line.quantity += item.quantity
            line.total += item.line_total

    items = sorted(lines.values(), key=lambda line: line.menu_item_id)
    return ConsolidatedOrder(
        items=items,
        total_quantity=sum(line.quantity for line in items),
        total=sum((line.total for line in items), start=Decimal("0")),
    )
