from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.participant import ParticipantCreate, ParticipantRead
from app.services import participant_service, party_service

router = APIRouter(prefix="/parties/{party_id}/participants", tags=["participants"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=ParticipantRead, status_code=201)
def join_party(party_id: int, data: ParticipantCreate, db: DbSession):
    party = party_service.get_party(db, party_id)
    if party is None:
        raise HTTPException(status_code=404, detail="Party not found")
    if not party.menu_confirmed:
        raise HTTPException(status_code=409, detail="The menu is not ready yet")
    return participant_service.add_participant(db, party_id, data.name)


@router.get("", response_model=list[ParticipantRead])
def list_participants(party_id: int, db: DbSession):
    if party_service.get_party(db, party_id) is None:
        raise HTTPException(status_code=404, detail="Party not found")
    return participant_service.list_participants(db, party_id)
