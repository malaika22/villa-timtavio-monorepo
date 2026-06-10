import { api, API } from '@/lib/api';
import type {
  CatalogItem,
  CatalogItemDetail,
  CatalogCategory,
  MenuItem,
  Recommendation,
} from '@repo/api-types';

export const catalogApi = {
  list: (category?: CatalogCategory) =>
    api.get<CatalogItem[]>(
      `${API.catalog.list}${category ? `?category=${category}` : ''}`,
    ),
  included: () => api.get<CatalogItem[]>(API.catalog.included),
  recommendations: () => api.get<Recommendation[]>(API.catalog.recommendations),
  menus: () => api.get<MenuItem[]>(API.catalog.menus),
  detail: (id: string) => api.get<CatalogItemDetail>(API.catalog.detail(id)),
};
