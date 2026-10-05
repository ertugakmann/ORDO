"use client";

import { useState } from "react";

import { useConsolidatedOrder } from "@/hooks/useLeader";
import { formatPrice } from "@/lib/money";

export default function ConsolidatedOrder({ partyId }: { partyId: number }) {
  const { data, isPending, isError, error } = useConsolidatedOrder(partyId);
  const [copied, setCopied] = useState(false);

  if (isPending) {
    return <p className="text-stone-500">Loading restaurant order...</p>;
  }
  if (isError) {
    return <p className="text-red-700">{error.message}</p>;
  }
  if (data.items.length === 0) {
    return (
      <p className="text-stone-500">
        No orders yet. The restaurant order appears here once guests submit.
      </p>
    );
  }

  // Plain text, ready to paste into a message to the restaurant.
  const text = data.items
    .map((item) => `${item.name} × ${item.quantity}`)
    .join("\n");

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-stone-200 rounded border border-stone-200 bg-white px-3">
        {data.items.map((item) => (
          <li key={item.menu_item_id} className="flex justify-between py-2">
            <span>{item.name}</span>
            <span className="font-medium">× {item.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-stone-600">
        {data.total_quantity} items · {formatPrice(data.total)}
      </p>
      <button
        onClick={copy}
        className="self-start rounded bg-stone-900 px-4 py-2 text-white hover:bg-stone-700"
      >
        {copied ? "Copied" : "Copy order"}
      </button>
    </div>
  );
}
