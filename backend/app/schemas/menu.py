from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

ItemName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
CategoryName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)
]
Description = Annotated[
    str | None, StringConstraints(strip_whitespace=True, max_length=500)
]
Price = Annotated[Decimal, Field(ge=0, le=9999.99, max_digits=6, decimal_places=2)]


class MenuItemInput(BaseModel):
    """Used to create an item and to update it (all fields are replaced)."""

    name: ItemName
    description: Description = None
    price: Price
    category: CategoryName


class MenuItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    party_id: int
    name: str
    description: str | None
    price: Decimal
    category: str


class MenuCategory(BaseModel):
    name: str
    items: list[MenuItemRead]


class MenuRead(BaseModel):
    categories: list[MenuCategory]
