import type { MenuCategory, MenuItem } from './catalog';

export type DiningRequestKind = 'SITTING' | 'ORDER';
export type DiningRequestStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';

/** Meal types eligible for a sit-down reservation. */
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface DiningOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
}

/** A secondary guest's late-arrival flag against the primary's sitting. */
export interface DiningLateArrival {
  email: string;
  name: string;
  note?: string | null;
  allergies?: string | null;
  /** ISO timestamp the flag was raised. */
  at: string;
}

/**
 * Estate-configured recommended sitting times per meal (24h "HH:MM"), shown to
 * the primary guest as selectable chips. Empty arrays are allowed.
 */
export interface SittingTimes {
  BREAKFAST: string[];
  LUNCH: string[];
  DINNER: string[];
}

export type UpdateSittingTimesDto = SittingTimes;

/** Payload a secondary guest sends to flag a late arrival to a sitting. */
export interface AddLateArrivalDto {
  note?: string;
  allergies?: string;
}

export interface DiningRequest {
  id: string;
  bookingId: string;
  requestedByEmail: string;
  requestedByName: string;
  kind: DiningRequestKind;
  status: DiningRequestStatus;

  // SITTING
  mealType?: MenuCategory | null;
  date?: string | null;
  time?: string | null;
  partySize?: number | null;
  allergies?: string | null;
  specialRequests?: string | null;

  // ORDER
  items?: DiningOrderItem[] | null;
  requestedFor?: string | null;
  notes?: string | null;

  // SITTING — late arrivals flagged by secondary guests
  lateArrivals?: DiningLateArrival[] | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * A queue row for the estate manager — the request plus the stay it belongs to.
 *
 * Dining requests used to surface only on a booking's own detail page, so one
 * nobody happened to open was one nobody answered. The worklist needs to name
 * the party without the EM having to go and look it up.
 */
export interface EmDiningQueueItem extends DiningRequest {
  booking?: {
    id: string;
    checkIn: string;
    checkOut: string;
    primaryGuest?: {
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
}

export interface CreateDiningSittingDto {
  kind: 'SITTING';
  mealType: MealType;
  date: string;
  time: string;
  partySize: number;
  allergies?: string;
  specialRequests?: string;
}

export interface CreateDiningOrderDto {
  kind: 'ORDER';
  items: DiningOrderItem[];
  requestedFor?: string;
  notes?: string;
}

export type CreateDiningRequestDto =
  | CreateDiningSittingDto
  | CreateDiningOrderDto;

/** Create/update payload for an estate-manager-managed menu item. */
export interface MenuItemDto {
  name: string;
  category: MenuCategory;
  description?: string;
  photoUrl?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  containsNuts?: boolean;
  containsDairy?: boolean;
  containsShellfish?: boolean;
  otherDietaryNotes?: string;
  sortOrder?: number;
}

// ─── Daily menus ─────────────────────────────────────────────────────────────

/** The three services planned per day. Snacks and drinks are always available. */
export type PlannedMeal = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export const PLANNED_MEALS: PlannedMeal[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export interface DailyMenuItem {
  id: string;
  menuItemId: string;
  sortOrder: number;
  menuItem: MenuItem;
}

/**
 * What the chef is actually cooking, for one meal on one day.
 *
 * `MenuItem` alone has no notion of "today", so every active dish was shown to
 * every guest on every day. A service is drawn from the dish library and stays
 * invisible until `publishedAt` is set — a half-decided Thursday should never
 * reach a guest.
 */
export interface DailyMenu {
  id: string;
  /** ISO date only, e.g. "2026-08-06". */
  date: string;
  mealType: MenuCategory;
  note?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  items: DailyMenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDailyMenuDto {
  date: string;
  mealType: MenuCategory;
  note?: string;
  /** The whole line-up, in reading order. Authoritative. */
  menuItemIds?: string[];
}

export interface CopyDailyMenuDto {
  fromStart: string;
  toStart: string;
  days?: number;
}

export interface CopyDailyMenuResult {
  copied: number;
  /** Services skipped because the target was already published. */
  skipped: number;
}

/** Days in the near future with nothing published — a silent failure otherwise. */
export interface DailyMenuGaps {
  withinDays: number;
  gaps: { date: string; missing: MenuCategory[] }[];
}
