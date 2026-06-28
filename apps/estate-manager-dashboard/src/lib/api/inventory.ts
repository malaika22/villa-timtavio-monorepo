import { api, API } from '@/lib/api';
import type { InventoryItem } from '@repo/api-types';

export const inventoryApi = {
  list: () => api.get<InventoryItem[]>(API.inventory.list),
  adjust: (id: string, delta: number, reason?: string) =>
    api.post<InventoryItem>(API.inventory.adjust(id), { delta, reason }),
  reorder: (id: string) =>
    api.patch<InventoryItem>(API.inventory.reorder(id)),
};
