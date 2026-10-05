from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Party(Base):
    __tablename__ = "parties"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    join_code: Mapped[str] = mapped_column(unique=True, index=True)
    # The menu only becomes active for guests once the leader confirms it.
    menu_confirmed: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="party")
    participants: Mapped[list["Participant"]] = relationship(back_populates="party")
    orders: Mapped[list["Order"]] = relationship(back_populates="party")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), index=True)
    name: Mapped[str]
    description: Mapped[str | None]
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    category: Mapped[str]

    party: Mapped["Party"] = relationship(back_populates="menu_items")


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), index=True)
    name: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    party: Mapped["Party"] = relationship(back_populates="participants")
    orders: Mapped[list["Order"]] = relationship(back_populates="participant")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id"), index=True)
    participant_id: Mapped[int] = mapped_column(
        ForeignKey("participants.id"), index=True
    )
    # "draft" or "submitted"
    status: Mapped[str] = mapped_column(default="draft")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    party: Mapped["Party"] = relationship(back_populates="orders")
    participant: Mapped["Participant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))
    quantity: Mapped[int]
    # Price at the time the order was submitted.
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    order: Mapped["Order"] = relationship(back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship()
