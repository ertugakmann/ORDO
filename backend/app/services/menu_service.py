from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import MenuItem, OrderItem, Party
from app.parsers.menu_parser import ParsedItem
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


def replace_menu(db: Session, party_id: int, parsed_items: list[ParsedItem]):
    """Replace all of a party's menu items with freshly parsed ones."""
    db.execute(delete(MenuItem).where(MenuItem.party_id == party_id))
    for parsed in parsed_items:
        db.add(
            MenuItem(
                party_id=party_id,
                name=parsed.name,
                description=parsed.description,
                price=parsed.price,
                category=parsed.category,
            )
        )
    db.commit()


def confirm_menu(db: Session, party: Party) -> Party:
    party.menu_confirmed = True
    db.commit()
    db.refresh(party)
    return party


def is_ordered(db: Session, item: MenuItem) -> bool:
    return (
        db.scalar(
            select(OrderItem.id).where(OrderItem.menu_item_id == item.id).limit(1)
        )
        is not None
    )
