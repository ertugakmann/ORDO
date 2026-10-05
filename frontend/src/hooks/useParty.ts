import { useMutation, useQuery } from "@tanstack/react-query";

import { apiGet, apiSend } from "@/lib/api";
import type { Party } from "@/types/api";

export function useCreateParty() {
  return useMutation({
    mutationFn: (name: string) =>
      apiSend<Party>("POST", "/api/v1/parties", { name }),
  });
}

export function usePartyByJoinCode(joinCode: string) {
  return useQuery({
    queryKey: ["party", joinCode],
    queryFn: () => apiGet<Party>(`/api/v1/parties/join/${joinCode}`),
    retry: false,
  });
}
