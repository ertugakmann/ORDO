from fastapi import APIRouter

from app.api.v1 import leader, menu, orders, participants, parties

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(parties.router)
api_router.include_router(menu.router)
api_router.include_router(participants.router)
api_router.include_router(orders.router)
api_router.include_router(leader.router)
