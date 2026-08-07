import type { MenuCategory, MenuCourse, MenuItem } from './catalog';

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

  // ── Exclusive additions — the only chargeable part of dining ──────────────
  /** Priced server-side when the order was placed, so later edits can't move it. */
  totalAmount?: number | null;
  /** The sitting this should arrive at, when the guest attached it. */
  linkedSittingId?: string | null;
  /** False only while a secondary's chargeable order waits on the primary. */
  primaryApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  declineReason?: string | null;
  folioItemId?: string | null;

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

/** The exclusive category is the only one that carries a price. */
export const EXCLUSIVE_CATEGORY = 'EXCLUSIVE' as const;

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
  /** Which course it belongs to. Omitted for snacks, beverages and exclusives. */
  course?: MenuCourse | null;
  /** Required for EXCLUSIVE items, meaningless for everything else. */
  price?: number | null;
  isStanding?: boolean;
}


// ─── Menu composition ────────────────────────────────────────────────────────
//
// The estate publishes its whole menu once; the primary member composes each
// day from it within allowances the estate sets per course. It replaces the
// weekly planner, where the estate chose every dish and the guest only read it.

export const COURSES_BY_MEAL: Record<MealType, MenuCourse[]> = {
  BREAKFAST: ['BREAKFAST_MAIN', 'BREAKFAST_SUGGESTION'],
  LUNCH: ['LUNCH_SELECTION'],
  DINNER: ['DINNER_STARTER', 'DINNER_MAIN', 'DINNER_DESSERT'],
};

/** What the estate calls each course when it talks to a guest. */
export const COURSE_LABELS: Record<MenuCourse, string> = {
  BREAKFAST_MAIN: 'Breakfast',
  BREAKFAST_SUGGESTION: 'Daily suggestion',
  LUNCH_SELECTION: 'Curated selection',
  DINNER_STARTER: 'Starters',
  DINNER_MAIN: 'Main dish',
  DINNER_DESSERT: 'Dessert',
};

/**
 * When a meal is served.
 *
 * `lastSeating` is why this is a window and not a list of slots. A guest given
 * 11:00 off a 9–11 breakfast list arrived exactly as the kitchen shut, so the
 * estate has to be able to say how late it can still take a table.
 */
export interface SittingWindow {
  /** 24h "HH:MM". */
  start: string;
  end: string;
  lastSeating: string;
}

export type SittingWindows = Record<MealType, SittingWindow>;

export interface MenuRules {
  /**
   * How far ahead of a service day the party's choices close, counted back from
   * midnight at the *start* of that day. At 24 a Tuesday is decided by Monday
   * 00:00 — the kitchen orders a full day before it cooks.
   */
  cutoffHours: number;
  courseLimits: Record<MenuCourse, number>;
}

export interface DiningRules {
  windows: SittingWindows;
  menu: MenuRules;
}

export interface MenuSelectionItem {
  id: string;
  menuItemId: string;
  course: MenuCourse;
  sortOrder: number;
  menuItem: MenuItem;
}

/** What a party has chosen for one meal on one day. */
export interface MenuSelection {
  id: string;
  /** ISO date only, e.g. "2026-08-31". */
  date: string;
  mealType: MenuCategory;
  /** The party's line to the kitchen, carried onto the run sheet verbatim. */
  note?: string | null;
  chosenByName?: string | null;
  chosenAt?: string | null;
  /** Set when the estate amended a day the kitchen had already been told about. */
  amendedByEmail?: string | null;
  amendedAt?: string | null;
  /**
   * The dish names as they stood before that amendment. A swap that silently
   * becomes the truth is worse than no swap — the chef needs to see what it
   * replaced.
   */
  amendedFrom?: string[] | null;
  items: MenuSelectionItem[];
}

export interface MenuPlanMeal {
  mealType: MealType;
  window: SittingWindow;
  courses: MenuCourse[];
  selection?: MenuSelection | null;
}

export interface MenuPlanDay {
  date: string;
  /** The moment this day stops being the party's to change. */
  closesAt: string;
  isLocked: boolean;
  /** Only the meals the party is present for — no breakfast on arrival day. */
  meals: MenuPlanMeal[];
}

export interface MenuPlan {
  bookingId: string;
  rules: DiningRules;
  days: MenuPlanDay[];
}

export interface UpsertMenuSelectionDto {
  date: string;
  mealType: MealType;
  /** The whole meal, in reading order. Authoritative. */
  menuItemIds: string[];
  note?: string;
}

// ─── The kitchen's run sheet ────────────────────────────────────────────────

/** One person in the party who can't eat something. */
export interface KitchenDietaryRow {
  name: string;
  allergies?: string | null;
  restrictions: string[];
  other?: string | null;
}

export interface KitchenService {
  bookingId: string;
  partyName: string;
  mealType: MealType;
  window: SittingWindow;
  sittingTime?: string | null;
  covers: number;
  lateArrivals?: DiningLateArrival[] | null;
  /**
   * Repeated on every service, deliberately. A page the chef works from should
   * never require them to remember to go and check the manifest.
   */
  dietary: KitchenDietaryRow[];
  note?: string | null;
  chosen?: MenuSelection | null;
  amendedAt?: string | null;
  amendedByEmail?: string | null;
}

export interface KitchenDay {
  date: string;
  closesAt: string;
  isLocked: boolean;
  services: KitchenService[];
}

export interface KitchenSheet {
  from: string;
  to: string;
  rules: DiningRules;
  days: KitchenDay[];
}
