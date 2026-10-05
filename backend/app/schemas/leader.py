from decimal import Decimal

from pydantic import BaseModel

from app.schemas.order import OrderItemRead


class DashboardParticipant(BaseModel):
    id: int
    name: str
    status: str  # "submitted" or "not_submitted"
    items: list[OrderItemRead]
    total: Decimal


class Dashboard(BaseModel):
    party_id: int
    party_name: str
    participants: list[DashboardParticipant]
    group_total: Decimal


class ConsolidatedItem(BaseModel):
    menu_item_id: int
    name: str
    category: str
    quantity: int
    total: Decimal


class ConsolidatedOrder(BaseModel):
    items: list[ConsolidatedItem]
    total_quantity: int
    total: Decimal
