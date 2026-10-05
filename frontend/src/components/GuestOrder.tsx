"use client";

import { useState } from "react";

import SubmittedOrder from "@/components/SubmittedOrder";
import { useMenu } from "@/hooks/useMenu";
import { useOrder, useSubmitOrder } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/money";
import { loadOrderId, saveOrderId, type SavedGuest } from "@/lib/storage";
import type { MenuItem } from "@/types/api";

export default function GuestOrder({
  partyId,
  guest,
}: {
  partyId: number;
  guest: SavedGuest;
}) {
  const [orderId, setOrderId] = useState<number | null>(() =>
    loadOrderId(partyId),
  );
  const savedOrder = useOrder(orderId);

  if (orderId !== null && savedOrder.isPending) {
    return <p className="text-stone-500">Loading your order...</p>;
  }

  if (savedOrder.data?.status === "submitted") {
    return <SubmittedOrder order={savedOrder.data} />;
  }

  return (
    <OrderForm
      partyId={partyId}
      guest={guest}
      onSubmitted={(id) => {
        saveOrderId(partyId, id);
        setOrderId(id);
      }}
    />
  );
}

function OrderForm({
  partyId,
  guest,
  onSubmitted,
}: {
  partyId: number;
  guest: SavedGuest;
  onSubmitted: (orderId: number) => void;
}) {
  const { data: menu, isPending, isError, error } = useMenu(partyId);
  // menu item id -> quantity
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const submitOrder = useSubmitOrder(partyId);

  if (isPending) {
    return <p className="text-stone-500">Loading menu...</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-red-700">
        {error.message}
      </p>
    );
  }
  if (menu.categories.length === 0) {
    return <p className="text-stone-500">No menu items found.</p>;
  }

  const allItems = menu.categories.flatMap((category) => category.items);
  const basket = allItems.filter((item) => (quantities[item.id] ?? 0) > 0);
  const total = basket.reduce(
    (sum, item) => sum + Number(item.price) * quantities[item.id],
    0,
  );

  function changeQuantity(item: MenuItem, change: number) {
    const next = Math.min(99, Math.max(0, (quantities[item.id] ?? 0) + change));
    setQuantities({ ...quantities, [item.id]: next });
  }

  function handleSubmit() {
    submitOrder.mutate(
      {
        participantId: guest.id,
        items: basket.map((item) => ({
          menu_item_id: item.id,
          quantity: quantities[item.id],
        })),
      },
      { onSuccess: (order) => onSubmitted(order.id) },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-stone-600">
        Hi {guest.name}, choose what you would like.
      </p>

      {menu.categories.map((category) => (
        <section key={category.name}>
          <h2 className="border-b border-stone-300 pb-1 text-xl font-semibold">
            {category.name}
          </h2>
          <ul className="divide-y divide-stone-200">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-sm text-stone-600">{item.description}</p>
                  )}
                  <p className="text-sm">{formatPrice(item.price)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    aria-label={`Remove one ${item.name}`}
                    onClick={() => changeQuantity(item, -1)}
                    disabled={(quantities[item.id] ?? 0) === 0}
                    className="h-9 w-9 rounded border border-stone-300 bg-white disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">
                    {quantities[item.id] ?? 0}
                  </span>
                  <button
                    aria-label={`Add one ${item.name}`}
                    onClick={() => changeQuantity(item, 1)}
                    className="h-9 w-9 rounded border border-stone-300 bg-white"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded border border-stone-300 bg-white p-4">
        <h2 className="pb-2 text-xl font-semibold">Your basket</h2>
        {basket.length === 0 ? (
          <p className="text-stone-500">Your basket is empty.</p>
        ) : (
          <ul className="pb-2">
            {basket.map((item) => (
              <li key={item.id} className="flex justify-between py-1">
                <span>
                  {quantities[item.id]} × {item.name}
                </span>
                <span>
                  {formatPrice(Number(item.price) * quantities[item.id])}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="pb-3 text-right text-lg font-semibold">
          Total: {formatPrice(total)}
        </p>
        {submitOrder.isError && (
          <p role="alert" className="pb-2 text-sm text-red-700">
            {submitOrder.error.message}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={basket.length === 0 || submitOrder.isPending}
          className="w-full rounded bg-green-700 px-4 py-2 text-white hover:bg-green-800 disabled:opacity-50"
        >
          {submitOrder.isPending ? "Submitting..." : "Submit order"}
        </button>
      </section>
    </div>
  );
}
