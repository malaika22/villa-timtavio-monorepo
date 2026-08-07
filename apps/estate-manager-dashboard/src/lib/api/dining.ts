import { api, API } from '@/lib/api';
import type {
  DiningRequest,
  DiningRules,
  EmDiningQueueItem,
  KitchenSheet,
  MenuSelection,
  UpsertMenuSelectionDto,
} from '@repo/api-types';

export const emDiningApi = {
  byBooking: (bookingId: string) =>
    api.get<DiningRequest[]>(API.dining.byBooking(bookingId)),
  /** Orders only — sittings confirm themselves and live on the run sheet. */
  queue: () => api.get<EmDiningQueueItem[]>(API.dining.queue),
  confirm: (id: string) => api.patch<DiningRequest>(API.dining.confirm(id)),
  cancel: (id: string) => api.patch<DiningRequest>(API.dining.cancel(id)),

  getRules: () => api.get<DiningRules>(API.menu.rules),
  updateRules: (dto: Partial<DiningRules>) =>
    api.patch<DiningRules>(API.menu.rules, dto),

  /** Every meal the estate is cooking over a stretch of days. */
  kitchen: (from: string, to: string) =>
    api.get<KitchenSheet>(API.menu.kitchen(from, to)),
  /** The concierge amending a day the kitchen has already been told about. */
  amendMeal: (bookingId: string, dto: UpsertMenuSelectionDto) =>
    api.put<MenuSelection>(API.menu.selections(bookingId), dto),
  /** Stop serving a meal the estate added, or clear a default one. */
  removeMeal: (bookingId: string, date: string, mealType: string) =>
    api.delete<{ bookingId: string }>(
      API.menu.removeSelection(bookingId, date, mealType),
    ),
  /** Ask the party to finish a day before it closes. */
  nudge: (bookingId: string, date: string) =>
    api.post<{ meals: string[] }>(API.menu.nudge(bookingId), { date }),
};
