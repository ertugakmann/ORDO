import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api";
import type { Health } from "@/types/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiGet<Health>("/health"),
    retry: false,
  });
}
