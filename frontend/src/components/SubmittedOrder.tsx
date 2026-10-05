import { formatPrice } from "@/lib/money";
import type { Order } from "@/types/api";

export default function SubmittedOrder({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded border border-green-300 bg-green-50 p-3 font-medium text-green-800">
        Order submitted successfully.
      </p>
      <ul className="divide-y divide-stone-200">
        {order.items.map((item) => (
          <li key={item.menu_item_id} className="flex justify-between py-2">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>
      <p className="text-right text-lg font-semibold">
        Total: {formatPrice(order.total)}
      </p>
    </div>
  );
}
