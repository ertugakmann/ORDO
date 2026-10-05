from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db.session import get_db
from app.schemas.order import OrderCreate, OrderRead
from app.services import order_service, party_service

router = APIRouter(tags=["orders"])

DbSession = Annotated[Session, Depends(get_db)]


def require_party(db: Session, party_id: int):
    party = party_service.get_party(db, party_id)
    if party is None:
        raise AppError(404, "Party not found")
    return party


@router.post("/parties/{party_id}/orders", response_model=OrderRead, status_code=201)
def create_order(party_id: int, data: OrderCreate, db: DbSession):
    party = require_party(db, party_id)
    order = order_service.create_draft_order(db, party, data.participant_id, data.items)
    return order_service.order_to_read(order)


@router.get("/parties/{party_id}/orders", response_model=list[OrderRead])
def list_orders(party_id: int, db: DbSession):
    require_party(db, party_id)
    orders = order_service.list_orders(db, party_id)
    return [order_service.order_to_read(order) for order in orders]


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: DbSession):
    return order_service.order_to_read(order_service.get_order(db, order_id))


@router.post("/orders/{order_id}/submit", response_model=OrderRead)
def submit_order(order_id: int, db: DbSession):
    order = order_service.get_order(db, order_id)
    return order_service.order_to_read(order_service.submit_order(db, order))
