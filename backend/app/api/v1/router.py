from fastapi import APIRouter

from app.api.v1 import menu, participants, parties

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(parties.router)
api_router.include_router(menu.router)
api_router.include_router(participants.router)
