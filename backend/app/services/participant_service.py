from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Participant


def add_participant(db: Session, party_id: int, name: str) -> Participant:
    participant = Participant(party_id=party_id, name=name)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def list_participants(db: Session, party_id: int) -> list[Participant]:
    return list(
        db.scalars(
            select(Participant)
            .where(Participant.party_id == party_id)
            .order_by(Participant.id)
        )
    )
