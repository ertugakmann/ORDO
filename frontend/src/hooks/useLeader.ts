import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { ConsolidatedOrder, Dashboard } from "@/types/api";

// The leader's view refreshes every few seconds as guests submit orders.
const REFRESH_MS = 5000;

export function useDashboard(partyId: number) {
  return useQuery({
    queryKey: ["dashboard", partyId],
    queryFn: () => apiGet<Dashboard>(`/api/v1/parties/${partyId}/dashboard`),
    refetchInterval: REFRESH_MS,
  });
}

export function useConsolidatedOrder(partyId: number) {
  return useQuery({
    queryKey: ["consolidated-order", partyId],
    queryFn: () =>
      apiGet<ConsolidatedOrder>(
        `/api/v1/parties/${partyId}/consolidated-order`,
      ),
    refetchInterval: REFRESH_MS,
  });
}
