import { api, API } from '@/lib/api';
import type {
  DashboardAlertBanner,
  DashboardExport,
  DashboardKpis,
  DashboardScheduleItem,
} from '@repo/api-types';

export const dashboardApi = {
  kpis: () => api.get<DashboardKpis>(API.dashboard.kpis),
  alertBanner: () => api.get<DashboardAlertBanner>(API.dashboard.alertBanner),
  scheduleToday: () =>
    api.get<DashboardScheduleItem[]>(API.dashboard.scheduleToday),
  export: () => api.get<DashboardExport>(API.dashboard.export),
};
