/** The lifecycle of a broker's claim on a range. */
export type BrokerHoldStatus = 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';

export interface BrokerHold {
  id: string;
  /**
   * Typed by the broker when placing the hold, not authenticated — the estate
   * issues one shared link rather than an account each. Treat it as a name to
   * call back, not as an identity.
   */
  brokerName: string;
  /** Null on holds placed before this was asked for; show as not recorded. */
  brokerEmail: string | null;
  brokerAgency: string | null;
  /** Party size. Null on holds placed before this was asked for. */
  guestCount: number | null;
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
  /**
   * When the hold covering this night lapses, ISO.
   *
   * Null when the night isn't held, and null when it is held by a *confirmed*
   * hold — which ignores the 48-hour clock and has no expiry to show. Both
   * mean the same thing to a reader: there is no countdown here.
   */
  heldUntil: string | null;
  /** Null where neither Lodgify nor the estate's season table has a rate. */
  rate: number | null;
  minNights: number;
  /** A stay begins here — free until the afternoon, sold from it. */
  arrivalDay: boolean;
  /** A stay ends here — occupied until the morning, and the night is sellable. */
  departureDay: boolean;
}

export interface BrokerAvailability {
  from: string;
  to: string;
  nights: BrokerAvailabilityNight[];
  /**
   * `lodgify` when at least one night is priced, `none` otherwise. There is no
   * indicative tier: the estate prices in Lodgify and nowhere else, so a rate
   * we invented would be a rate a broker quotes to a client.
   */
  rateSource: 'lodgify' | 'none';
  /**
   * ISO code from the rental's Lodgify settings — never assumed. Null when it
   * couldn't be established, in which case no night carries a rate either.
   */
  currency: string | null;
  holdHours: number;
}

export interface CreateBrokerHoldDto {
  brokerName: string;
  brokerEmail: string;
  brokerAgency?: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  note?: string;
}

/** What the villa sleeps — the ceiling on a hold's party size. */
export const MAX_PARTY_SIZE = 14;

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
export function holdTimeLeft(
  expiresAt: string,
): { hours: number; minutes: number } | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    hours: Math.floor(ms / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
  };
}
