import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiSend, apiUpload } from "@/lib/api";
import type { Menu, MenuItem, MenuItemInput, Party } from "@/types/api";

export function useMenu(partyId: number) {
  return useQuery({
    queryKey: ["menu", partyId],
    queryFn: () => apiGet<Menu>(`/api/v1/parties/${partyId}/menu`),
  });
}

// Every menu change refreshes the menu (and the party, for the confirmed flag).
function useRefreshMenu(partyId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["menu", partyId] });
    queryClient.invalidateQueries({ queryKey: ["party"] });
  };
}

export function useUploadMenu(partyId: number) {
  const refresh = useRefreshMenu(partyId);
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload<Menu>(
        `/api/v1/parties/${partyId}/menu/upload`,
        formData,
      );
    },
    onSuccess: refresh,
  });
}

export function useAddMenuItem(partyId: number) {
  const refresh = useRefreshMenu(partyId);
  return useMutation({
    mutationFn: (item: MenuItemInput) =>
      apiSend<MenuItem>("POST", `/api/v1/parties/${partyId}/menu-items`, item),
    onSuccess: refresh,
  });
}

export function useUpdateMenuItem(partyId: number) {
  const refresh = useRefreshMenu(partyId);
  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: MenuItemInput }) =>
      apiSend<MenuItem>("PUT", `/api/v1/menu-items/${id}`, item),
    onSuccess: refresh,
  });
}

export function useDeleteMenuItem(partyId: number) {
  const refresh = useRefreshMenu(partyId);
  return useMutation({
    mutationFn: (id: number) =>
      apiSend<void>("DELETE", `/api/v1/menu-items/${id}`),
    onSuccess: refresh,
  });
}

export function useConfirmMenu(partyId: number) {
  const refresh = useRefreshMenu(partyId);
  return useMutation({
    mutationFn: () =>
      apiSend<Party>("POST", `/api/v1/parties/${partyId}/menu/confirm`),
    onSuccess: refresh,
  });
}
