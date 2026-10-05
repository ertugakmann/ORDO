import { useMutation } from "@tanstack/react-query";

import { apiSend } from "@/lib/api";
import type { Participant } from "@/types/api";

export function useJoinParty(partyId: number) {
  return useMutation({
    mutationFn: (name: string) =>
      apiSend<Participant>("POST", `/api/v1/parties/${partyId}/participants`, {
        name,
      }),
  });
}
