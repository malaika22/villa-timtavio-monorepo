/** How long a broker's claim on a range survives without the estate acting. */
export const HOLD_HOURS = 48;

/** The furthest ahead the calendar will answer for, in days. */
export const MAX_HORIZON_DAYS = 400;

/** What the villa sleeps. A hold for more is refused rather than negotiated. */
export const MAX_PARTY_SIZE = 14;

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
  /**
   * A stay begins here — free until the afternoon, sold from it. The night is
   * gone, so this is not a date a broker can arrive on.
   */
  arrivalDay: boolean;
  /**
   * A stay ends here — occupied until the morning, free after. The night is
   * sellable, which is what makes this worth showing at all: without it, a
   * changeover looks identical to a date nobody ever booked.
   */
  departureDay: boolean;
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
