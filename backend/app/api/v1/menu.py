from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.parsers.menu_parser import MenuParseError, parse_menu_pdf
from app.schemas.menu import MenuItemInput, MenuItemRead, MenuRead
from app.schemas.party import PartyRead
from app.services import menu_service, party_service

router = APIRouter(tags=["menu"])

DbSession = Annotated[Session, Depends(get_db)]

MAX_PDF_SIZE = 5 * 1024 * 1024  # 5 MB


def require_party(db: Session, party_id: int):
    party = party_service.get_party(db, party_id)
    if party is None:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


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
    if menu_service.is_ordered(db, item):
        raise HTTPException(
            status_code=409,
            detail="This item is part of an order and cannot be deleted",
        )
    menu_service.delete_menu_item(db, item)
    return Response(status_code=204)


@router.post("/parties/{party_id}/menu/upload", response_model=MenuRead)
async def upload_menu(party_id: int, file: UploadFile, db: DbSession):
    party = require_party(db, party_id)
    if party.menu_confirmed:
        raise HTTPException(status_code=409, detail="Menu is already confirmed")

    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    # Read one byte more than the limit so we can tell the file is too big.
    pdf_bytes = await file.read(MAX_PDF_SIZE + 1)
    if len(pdf_bytes) > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="PDF is too large (max 5 MB)")
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    try:
        parsed_items = parse_menu_pdf(pdf_bytes)
    except MenuParseError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if not parsed_items:
        raise HTTPException(status_code=422, detail="No menu items found.")

    menu_service.replace_menu(db, party_id, parsed_items)
    return menu_service.get_menu(db, party_id)


@router.post("/parties/{party_id}/menu/confirm", response_model=PartyRead)
def confirm_menu(party_id: int, db: DbSession):
    party = require_party(db, party_id)
    if not menu_service.get_menu(db, party_id).categories:
        raise HTTPException(
            status_code=422, detail="Add at least one menu item before confirming"
        )
    return menu_service.confirm_menu(db, party)
