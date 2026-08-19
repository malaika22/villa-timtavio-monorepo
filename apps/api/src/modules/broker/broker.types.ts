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
   * `lodgify` when at least one night carries a real rate, `none` otherwise.
   * There is no third state: the estate prices in Lodgify and nowhere else,
   * so a figure we invented would be a figure a broker quotes to a client.
   */
  rateSource: 'lodgify' | 'none';
  /**
   * ISO code as configured on the rental in Lodgify — never assumed. Null when
   * it couldn't be established, in which case every night is unpriced too.
   */
  currency: string | null;
  holdHours: number;
}

/**
 * Assumed minimum stay until Lodgify says otherwise. Every night Lodgify
 * prices may also carry its own `min_stay`, which wins — the estate sets stay
 * rules where it sets rates, and this is only the gap-filler.
 */
export const DEFAULT_MIN_NIGHTS = 4;
