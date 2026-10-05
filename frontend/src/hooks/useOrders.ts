import { useMutation, useQuery } from "@tanstack/react-query";

import { apiGet, apiSend } from "@/lib/api";
import type { Order } from "@/types/api";

export function useOrder(orderId: number | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiGet<Order>(`/api/v1/orders/${orderId}`),
    enabled: orderId !== null,
    retry: false,
  });
}

type SubmitInput = {
  participantId: number;
  items: { menu_item_id: number; quantity: number }[];
};

// An order is created as a draft first, then submitted.
export function useSubmitOrder(partyId: number) {
  return useMutation({
    mutationFn: async ({ participantId, items }: SubmitInput) => {
      const draft = await apiSend<Order>(
        "POST",
        `/api/v1/parties/${partyId}/orders`,
        { participant_id: participantId, items },
      );
      return apiSend<Order>("POST", `/api/v1/orders/${draft.id}/submit`);
    },
  });
}
