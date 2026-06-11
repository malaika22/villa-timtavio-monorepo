import { api, API } from '@/lib/api';
import type {
  CreateExperienceCategoryDto,
  ExperienceCategory,
  UpdateExperienceCategoryDto,
} from '@repo/api-types';

export const experienceCategoriesApi = {
  list: (includeInactive = false) =>
    api.get<ExperienceCategory[]>(
      `${API.experienceCategories.list}${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  byId: (id: string) =>
    api.get<ExperienceCategory>(API.experienceCategories.byId(id)),
  create: (dto: CreateExperienceCategoryDto) =>
    api.post<ExperienceCategory>(API.experienceCategories.list, dto),
  update: (id: string, dto: UpdateExperienceCategoryDto) =>
    api.patch<ExperienceCategory>(API.experienceCategories.byId(id), dto),
  delete: (id: string) => api.delete<void>(API.experienceCategories.byId(id)),
};
