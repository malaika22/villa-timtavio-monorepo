// Local mirrors of the menu-composition contract. The Nest app uses CommonJS
// module resolution and doesn't consume @repo/api-types directly, so these are
// kept in sync with packages/api-types/src/dining.ts by hand.

import { MenuCourse } from '@prisma/client';

/** The three meals a party composes. Snacks and drinks are ordered on demand. */
export type ComposedMeal = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export const COMPOSED_MEALS: ComposedMeal[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

/** Which courses make up each meal, in the order they're read and eaten. */
export const COURSES_BY_MEAL: Record<ComposedMeal, MenuCourse[]> = {
  BREAKFAST: [MenuCourse.BREAKFAST_MAIN, MenuCourse.BREAKFAST_SUGGESTION],
  LUNCH: [MenuCourse.LUNCH_SELECTION],
  DINNER: [
    MenuCourse.DINNER_STARTER,
    MenuCourse.DINNER_MAIN,
    MenuCourse.DINNER_DESSERT,
  ],
};

export const MEAL_BY_COURSE: Record<MenuCourse, ComposedMeal> = {
  BREAKFAST_MAIN: 'BREAKFAST',
  BREAKFAST_SUGGESTION: 'BREAKFAST',
  LUNCH_SELECTION: 'LUNCH',
  DINNER_STARTER: 'DINNER',
  DINNER_MAIN: 'DINNER',
  DINNER_DESSERT: 'DINNER',
};

/**
 * When a meal is served.
 *
 * `lastSeating` is the reason this is a window and not a list of slots. A guest
 * offered 11:00 off a 9–11 breakfast list arrived exactly as the kitchen shut,
 * so the estate has to be able to say how late it can still take a table.
 */
export interface SittingWindow {
  start: string;
  end: string;
  lastSeating: string;
}

export type SittingWindows = Record<ComposedMeal, SittingWindow>;

export interface MenuRules {
  /**
   * How far ahead of a service day the party's choices close, counted back from
   * midnight at the *start* of that day. At 24 a Tuesday is decided by Monday
   * 00:00 — the kitchen orders a full day before it cooks.
   */
  cutoffHours: number;
  /** How many dishes the party may choose from each course. */
  courseLimits: Record<MenuCourse, number>;
}

export interface DiningRules {
  windows: SittingWindows;
  menu: MenuRules;
}

export const DEFAULT_WINDOWS: SittingWindows = {
  BREAKFAST: { start: '09:00', end: '11:00', lastSeating: '10:30' },
  LUNCH: { start: '12:00', end: '16:00', lastSeating: '15:30' },
  DINNER: { start: '19:00', end: '21:00', lastSeating: '20:30' },
};

/** The allowances as the estate's menu prints them. */
export const DEFAULT_COURSE_LIMITS: Record<MenuCourse, number> = {
  BREAKFAST_MAIN: 3,
  BREAKFAST_SUGGESTION: 1,
  LUNCH_SELECTION: 5,
  DINNER_STARTER: 1,
  DINNER_MAIN: 1,
  DINNER_DESSERT: 1,
};

export const DEFAULT_CUTOFF_HOURS = 24;
