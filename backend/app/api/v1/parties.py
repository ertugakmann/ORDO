from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.party import PartyCreate, PartyRead
from app.services import party_service

router = APIRouter(prefix="/parties", tags=["parties"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=PartyRead, status_code=201)
def create_party(data: PartyCreate, db: DbSession):
    return party_service.create_party(db, data.name)


# Declared before "/{party_id}" so "join" is never read as an id.
@router.get("/join/{join_code}", response_model=PartyRead)
def get_party_by_join_code(join_code: str, db: DbSession):
    party = party_service.get_party_by_join_code(db, join_code)
    if party is None:
        raise HTTPException(status_code=404, detail="Invalid join code")
    return party


@router.get("/{party_id}", response_model=PartyRead)
def get_party(party_id: int, db: DbSession):
    party = party_service.get_party(db, party_id)
    if party is None:
        raise HTTPException(status_code=404, detail="Party not found")
    return party
