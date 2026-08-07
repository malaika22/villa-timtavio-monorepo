import { api, API } from '@/lib/api';
import type {
  CreateDiningRequestDto,
  DiningRequest,
  DiningRules,
  MenuPlan,
  MenuSelection,
  UpsertMenuSelectionDto,
  AddLateArrivalDto,
} from '@repo/api-types';

export const diningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  create: (bookingId: string, dto: CreateDiningRequestDto) =>
    api.post<DiningRequest>(API.dining.create(bookingId), dto),
  addLateArrival: (id: string, dto: AddLateArrivalDto) =>
    api.post<DiningRequest>(API.dining.lateArrival(id), dto),
  cancel: (id: string) => api.patch<DiningRequest>(API.dining.cancel(id), {}),
  pendingApprovals: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.approvals(bookingId)),
  approve: (id: string) => api.patch<DiningRequest>(API.dining.approve(id), {}),
  decline: (id: string, reason?: string) =>
    api.patch<DiningRequest>(API.dining.decline(id), { reason }),

  /** Service windows, per-course allowances and the cutoff. */
  rules: () => api.get<DiningRules>(API.menu.rules),
  /** The stay day by day: what's chosen, what's still open. */
  menuPlan: (bookingId: string) => api.get<MenuPlan>(API.menu.plan(bookingId)),
  composeMeal: (bookingId: string, dto: UpsertMenuSelectionDto) =>
    api.put<MenuSelection>(API.menu.selections(bookingId), dto),
};
