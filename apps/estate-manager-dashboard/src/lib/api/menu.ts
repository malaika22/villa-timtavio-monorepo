import { api, API } from '@/lib/api';
import type { MenuItem, MenuItemDto } from '@repo/api-types';

export const emMenuApi = {
  list: () => api.get<MenuItem[]>(API.catalog.menus),
  create: (dto: MenuItemDto) => api.post<MenuItem>(API.catalog.menus, dto),
  update: (id: string, dto: Partial<MenuItemDto>) =>
    api.patch<MenuItem>(API.catalog.menuById(id), dto),
  remove: (id: string) => api.delete<void>(API.catalog.menuById(id)),
};
