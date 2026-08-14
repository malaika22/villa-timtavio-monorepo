/** How long a broker's claim on a range survives without the estate acting. */
export const HOLD_HOURS = 48;

/** The furthest ahead the calendar will answer for, in days. */
export const MAX_HORIZON_DAYS = 400;

/** A sanity bound on a single hold — not a policy, a guard against nonsense. */
export const MAX_HOLD_NIGHTS = 60;

export type NightStatus = 'OPEN' | 'TAKEN' | 'HELD';

export interface AvailabilityNight {
  /** YYYY-MM-DD. The night begun by this date, not the day itself. */
  date: string;
  status: NightStatus;
  /** Nightly rate, or null where neither Lodgify nor the season table has one. */
  rate: number | null;
  /** Minimum nights for a stay arriving on this date. */
  minNights: number;
}

export interface AvailabilityWindow {
  from: string;
  to: string;
  nights: AvailabilityNight[];
  /**
   * Where the prices came from. The page shows an "indicative" label for
   * anything other than `lodgify`, and hides money entirely for `none`.
   */
  rateSource: 'lodgify' | 'season' | 'mixed' | 'none';
  currency: 'USD';
  holdHours: number;
}

/** One row of EstateSettings.seasonRates. */
export interface SeasonRate {
  name: string;
  /** Inclusive YYYY-MM-DD bounds. */
  from: string;
  to: string;
  nightly: number;
  minNights: number;
}

/**
 * Used when the estate has set no seasons at all. Deliberately conservative:
 * a long minimum and no price, so the page shows availability without ever
 * inventing a number a broker could quote.
 */
export const DEFAULT_MIN_NIGHTS = 4;
