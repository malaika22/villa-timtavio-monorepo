/** The lifecycle of a broker's claim on a range. */
export type BrokerHoldStatus = 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';

export interface BrokerHold {
  id: string;
  /**
   * Typed by the broker on the page, not authenticated — the estate issues one
   * shared link rather than an account each. Treat it as a name to call back,
   * not as an identity.
   */
  brokerName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  /** Decimal on the wire — a string. Coerce once at the boundary. */
  estimatedTotal: string | null;
  /** Which source priced it: `lodgify`, `season`, or `mixed`. */
  estimateSource: string | null;
  status: BrokerHoldStatus;
  expiresAt: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  releasedAt: string | null;
  releasedBy: string | null;
  note: string | null;
}

/** Whether a night can be sold, and to whom it's already spoken for. */
export type BrokerNightStatus = 'OPEN' | 'TAKEN' | 'HELD';

export interface BrokerAvailabilityNight {
  /** YYYY-MM-DD — the night begun by this date. */
  date: string;
  status: BrokerNightStatus;
  /** Null where neither Lodgify nor the estate's season table has a rate. */
  rate: number | null;
  minNights: number;
}

export interface BrokerAvailability {
  from: string;
  to: string;
  nights: BrokerAvailabilityNight[];
  /**
   * `lodgify` is a real rate. Anything else is indicative and must be labelled
   * as such on screen — a broker quotes whatever number they're shown.
   */
  rateSource: 'lodgify' | 'season' | 'mixed' | 'none';
  currency: 'USD';
  holdHours: number;
}

export interface CreateBrokerHoldDto {
  brokerName: string;
  checkIn: string;
  checkOut: string;
  note?: string;
}

/** One row of the estate's indicative season table. */
export interface SeasonRate {
  name: string;
  /** Inclusive YYYY-MM-DD bounds. */
  from: string;
  to: string;
  nightly: number;
  minNights: number;
}

export const BROKER_HOLD_STATUS_LABELS: Record<BrokerHoldStatus, string> = {
  PENDING: 'Holding',
  CONFIRMED: 'Confirmed',
  RELEASED: 'Released',
  EXPIRED: 'Lapsed',
};

/**
 * Hours and minutes left, or null once it's gone. Recomputed on render rather
 * than stored — a countdown persisted anywhere is a countdown that goes stale.
 */
export function holdTimeLeft(expiresAt: string): { hours: number; minutes: number } | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    hours: Math.floor(ms / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
  };
}
