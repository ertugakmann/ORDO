from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MenuItem
from app.schemas.menu import MenuCategory, MenuItemInput, MenuRead


def get_menu(db: Session, party_id: int) -> MenuRead:
    items = db.scalars(
        select(MenuItem).where(MenuItem.party_id == party_id).order_by(MenuItem.id)
    ).all()

    # Group items by category, keeping the order the categories first appear in.
    categories: dict[str, MenuCategory] = {}
    for item in items:
        if item.category not in categories:
            categories[item.category] = MenuCategory(name=item.category, items=[])
        categories[item.category].items.append(item)
    return MenuRead(categories=list(categories.values()))


def add_menu_item(db: Session, party_id: int, data: MenuItemInput) -> MenuItem:
    item = MenuItem(party_id=party_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_menu_item(db: Session, menu_item_id: int) -> MenuItem | None:
    return db.get(MenuItem, menu_item_id)


def update_menu_item(db: Session, item: MenuItem, data: MenuItemInput) -> MenuItem:
    for field, value in data.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_menu_item(db: Session, item: MenuItem):
    db.delete(item)
    db.commit()
