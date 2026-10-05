"use client";

import { useDashboard } from "@/hooks/useLeader";
import { formatPrice } from "@/lib/money";

export default function LeaderDashboard({ partyId }: { partyId: number }) {
  const { data, isPending, isError, error } = useDashboard(partyId);

  if (isPending) {
    return <p className="text-stone-500">Loading orders...</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="text-red-700">
        {error.message}
      </p>
    );
  }

  const submittedCount = data.participants.filter(
    (participant) => participant.status === "submitted",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">
        {submittedCount} of {data.participants.length} submitted
      </p>

      {data.participants.length === 0 && (
        <p className="text-stone-500">
          No one has joined yet. Share the link above with your group.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {data.participants.map((participant) => (
          <li
            key={participant.id}
            className="rounded border border-stone-200 bg-white p-3"
          >
            <div className="flex justify-between font-medium">
              <span>
                {participant.status === "submitted" ? "✓" : "○"}{" "}
                {participant.name}
                <span className="pl-2 text-sm font-normal text-stone-500">
                  {participant.status === "submitted"
                    ? "Submitted"
                    : "Not submitted"}
                </span>
              </span>
              {participant.status === "submitted" && (
                <span>{formatPrice(participant.total)}</span>
              )}
            </div>
            {participant.items.length > 0 && (
              <ul className="pt-2 text-sm text-stone-700">
                {participant.items.map((item) => (
                  <li key={item.menu_item_id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>{formatPrice(item.line_total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <p className="border-t border-stone-300 pt-3 text-right text-lg font-semibold">
        Group total: {formatPrice(data.group_total)}
      </p>
    </div>
  );
}
