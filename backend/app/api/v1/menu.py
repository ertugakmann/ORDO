from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.menu import MenuItemInput, MenuItemRead, MenuRead
from app.services import menu_service, party_service

router = APIRouter(tags=["menu"])

DbSession = Annotated[Session, Depends(get_db)]


def require_party(db: Session, party_id: int):
    if party_service.get_party(db, party_id) is None:
        raise HTTPException(status_code=404, detail="Party not found")


def require_menu_item(db: Session, menu_item_id: int):
    item = menu_service.get_menu_item(db, menu_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


@router.get("/parties/{party_id}/menu", response_model=MenuRead)
def get_menu(party_id: int, db: DbSession):
    require_party(db, party_id)
    return menu_service.get_menu(db, party_id)


@router.post(
    "/parties/{party_id}/menu-items", response_model=MenuItemRead, status_code=201
)
def add_menu_item(party_id: int, data: MenuItemInput, db: DbSession):
    require_party(db, party_id)
    return menu_service.add_menu_item(db, party_id, data)


@router.put("/menu-items/{menu_item_id}", response_model=MenuItemRead)
def update_menu_item(menu_item_id: int, data: MenuItemInput, db: DbSession):
    item = require_menu_item(db, menu_item_id)
    return menu_service.update_menu_item(db, item, data)


@router.delete("/menu-items/{menu_item_id}", status_code=204)
def delete_menu_item(menu_item_id: int, db: DbSession):
    item = require_menu_item(db, menu_item_id)
    menu_service.delete_menu_item(db, item)
    return Response(status_code=204)
