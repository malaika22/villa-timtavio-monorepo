import { api, API } from '@/lib/api';
import type {
  CopyDailyMenuDto,
  CopyDailyMenuResult,
  DailyMenu,
  DailyMenuGaps,
  UpsertDailyMenuDto,
} from '@repo/api-types';

export const dailyMenuApi = {
  range: (from: string, to: string) =>
    api.get<DailyMenu[]>(API.dailyMenus.range(from, to)),
  gaps: (withinDays: number) =>
    api.get<DailyMenuGaps>(API.dailyMenus.gaps(withinDays)),
  upsert: (dto: UpsertDailyMenuDto) =>
    api.post<DailyMenu>(API.dailyMenus.upsert, dto),
  copy: (dto: CopyDailyMenuDto) =>
    api.post<CopyDailyMenuResult>(API.dailyMenus.copy, dto),
  publish: (id: string) => api.patch<DailyMenu>(API.dailyMenus.publish(id)),
  unpublish: (id: string) => api.patch<DailyMenu>(API.dailyMenus.unpublish(id)),
  remove: (id: string) => api.delete<{ id: string }>(API.dailyMenus.remove(id)),
};
