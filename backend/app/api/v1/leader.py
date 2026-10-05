from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db.session import get_db
from app.schemas.leader import ConsolidatedOrder, Dashboard
from app.services import leader_service, party_service

router = APIRouter(prefix="/parties/{party_id}", tags=["leader"])

DbSession = Annotated[Session, Depends(get_db)]


def require_party(db: Session, party_id: int):
    party = party_service.get_party(db, party_id)
    if party is None:
        raise AppError(404, "Party not found")
    return party


@router.get("/dashboard", response_model=Dashboard)
def get_dashboard(party_id: int, db: DbSession):
    party = require_party(db, party_id)
    return leader_service.get_dashboard(db, party)


@router.get("/consolidated-order", response_model=ConsolidatedOrder)
def get_consolidated_order(party_id: int, db: DbSession):
    require_party(db, party_id)
    return leader_service.get_consolidated_order(db, party_id)
