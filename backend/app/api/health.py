from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter()


@router.get("/health")
def health_check(db: Annotated[Session, Depends(get_db)]):
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "service": "ordo-api",
        "database": "ok",
    }
