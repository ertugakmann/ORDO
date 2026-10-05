import secrets

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Party

# No 0/O or 1/I so codes are easy to read out loud.
CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def make_join_code() -> str:
    return "".join(secrets.choice(CODE_CHARS) for _ in range(CODE_LENGTH))


def create_party(db: Session, name: str) -> Party:
    # The join_code column is unique, so on a (very unlikely) clash try again.
    for _ in range(5):
        party = Party(name=name, join_code=make_join_code())
        db.add(party)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(party)
        return party
    raise RuntimeError("Could not generate a unique join code")


def get_party(db: Session, party_id: int) -> Party | None:
    return db.get(Party, party_id)


def get_party_by_join_code(db: Session, join_code: str) -> Party | None:
    return db.scalar(select(Party).where(Party.join_code == join_code.upper()))
