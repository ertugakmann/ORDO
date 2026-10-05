from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class OrderItemInput(BaseModel):
    menu_item_id: int
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    participant_id: int
    items: list[OrderItemInput] = Field(min_length=1, max_length=100)


class OrderItemRead(BaseModel):
    menu_item_id: int
    name: str
    quantity: int
    price_snapshot: Decimal
    line_total: Decimal


class OrderRead(BaseModel):
    id: int
    party_id: int
    participant_id: int
    status: str
    created_at: datetime
    items: list[OrderItemRead]
    total: Decimal
