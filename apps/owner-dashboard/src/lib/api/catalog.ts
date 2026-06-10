import { api, API } from '@/lib/api';
import type { CatalogItem } from '@repo/api-types';

export const ownerCatalogApi = {
  adminAll: () => api.get<CatalogItem[]>(API.catalog.adminAll),
  list: () => api.get<CatalogItem[]>(API.catalog.list),
};
