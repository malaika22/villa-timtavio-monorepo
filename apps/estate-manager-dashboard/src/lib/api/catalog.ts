import { api, API } from '@/lib/api';
import type {
  CatalogItem,
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  Recommendation,
  PriceUnit,
} from '@repo/api-types';

export const emCatalogApi = {
  adminAll: () => api.get<CatalogItem[]>(API.catalog.adminAll),
  recommendations: () => api.get<Recommendation[]>(API.catalog.recommendations),
  priceUnits: () => api.get<PriceUnit[]>(API.catalog.priceUnits),
  createRecommendation: (data: Partial<Recommendation>) =>
    api.post<Recommendation>(API.catalog.recommendations, data),
  updateRecommendation: (id: string, data: Partial<Recommendation>) =>
    api.patch<Recommendation>(API.catalog.recommendationById(id), data),
  list: () => api.get<CatalogItem[]>(API.catalog.list),
  byId: (id: string) => api.get<CatalogItem>(API.catalog.byId(id)),
  toggleActive: (id: string) =>
    api.patch<CatalogItem>(API.catalog.toggleActive(id)),
  create: (dto: CreateCatalogItemDto) =>
    api.post<CatalogItem>(API.catalog.list, dto),
  update: (id: string, dto: UpdateCatalogItemDto) =>
    api.patch<CatalogItem>(API.catalog.byId(id), dto),
  delete: (id: string) => api.delete<void>(API.catalog.byId(id)),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postFormData<{ imported: number; errors: string[] }>(
      API.catalog.importCsv,
      formData,
    );
  },
};
