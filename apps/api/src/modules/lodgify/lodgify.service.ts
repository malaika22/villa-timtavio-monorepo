import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

import {
  normalizeLodgifyBooking,
  type LodgifySyncPayload,
} from './lodgify-booking.mapper';

/**
 * What Lodgify says about one reservation when asked directly.
 *
 * `unknown` means the question could not be answered — an outage, a bad
 * token, a timeout. It is never grounds to change anything.
 */
export type LodgifyPresence =
  | { state: 'present' }
  | { state: 'gone' }
  | { state: 'not-a-stay'; reason: string }
  | { state: 'unknown' };

@Injectable()
export class LodgifyService {
  private readonly logger = new Logger(LodgifyService.name);
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.lodgify.com/v2',
      headers: {
        'X-ApiKey': config.get('LODGIFY_API_KEY'),
        'Content-Type': 'application/json',
      },
    });
  }

  async getBookings(from?: string, to?: string) {
    const response = await this.client.get('/reservations/bookings', {
      params: {
        propertyId: this.config.get('LODGIFY_PROPERTY_ID'),
        dateArrivalMin: from,
        dateDepartureMax: to,
        size: 100,
      },
    });
    return response.data;
  }

  async getBookingById(lodgifyId: string) {
    const response = await this.client.get(
      `/reservations/bookings/${lodgifyId}`,
    );
    return response.data;
  }

  /**
   * Whether Lodgify still holds a reservation, asked one id at a time.
   *
   * `fetchBookingForSync` cannot answer this: it returns null for a deleted
   * reservation, a declined one, a malformed payload and a dropped connection
   * alike. That is fine when the answer only decides whether to sync — it is
   * not fine when the answer decides whether to cancel a stay, because a
   * network blip would look exactly like a deletion.
   *
   * So the states are kept apart, and only two of them are grounds to act.
   * `unknown` is deliberately a distinct answer rather than a thrown error:
   * the caller's correct response to "I could not find out" is to leave the
   * booking alone and try again on the next poll.
   */
  async confirmReservation(lodgifyId: string): Promise<LodgifyPresence> {
    try {
      const raw = await this.getBookingById(lodgifyId);
      const record =
        raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

      if (normalizeLodgifyBooking(record) !== null) return { state: 'present' };

      // It answered, and what it described is not a stay. The reason is worth
      // carrying: "declined" and "deleted" read very differently in an audit
      // entry six months later.
      const status =
        typeof record.status === 'string' ? record.status.toLowerCase() : null;
      return {
        state: 'not-a-stay',
        reason:
          record.is_deleted === true
            ? 'deleted'
            : record.canceled_at != null
              ? 'cancelled'
              : (status ?? 'not a stay'),
      };
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      // 404 is the one error that is an answer. 410 too, if Lodgify ever
      // starts using it.
      if (status === 404 || status === 410) return { state: 'gone' };

      this.logger.warn(
        `Could not confirm Lodgify reservation ${lodgifyId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return { state: 'unknown' };
    }
  }

  async fetchBookingForSync(
    lodgifyId: string,
  ): Promise<LodgifySyncPayload | null> {
    try {
      const raw = await this.getBookingById(lodgifyId);
      const normalized = normalizeLodgifyBooking(
        raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {},
      );

      if (!normalized) {
        this.logger.warn(
          `Could not normalize Lodgify booking ${lodgifyId} from API response`,
        );
      }

      return normalized;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Lodgify booking ${lodgifyId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }

  async blockDates(from: string, to: string, reason: string) {
    const response = await this.client.post('/availability/block', {
      propertyId: this.config.get('LODGIFY_PROPERTY_ID'),
      from,
      to,
      reason,
    });
    return response.data;
  }

  // ─── Availability + rates (read) ──────────────────────────────────────────
  //
  // The broker calendar asks these on every page load, and a broker checking
  // three date ranges in a row shouldn't cost three round trips to Lodgify.
  // A short in-memory cache is enough: the API runs as a single instance, and
  // availability that is sixty seconds stale is not a problem the way a slow
  // page is. Restarting the process simply empties it.
  private cache = new Map<string, { at: number; value: unknown }>();
  private static readonly CACHE_MS = 60_000;

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < LodgifyService.CACHE_MS) {
      return hit.value as T;
    }
    const value = await load();
    this.cache.set(key, { at: Date.now(), value });
    return value;
  }

  /** YYYY-MM-DD in no particular timezone — Lodgify deals in plain dates. */
  private static day(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * Every night from `start` to `end`, INCLUSIVE of both.
   *
   * Lodgify's availability periods close on the last occupied night, not on the
   * checkout date. This was first written exclusive — the natural reading if you
   * picture a period as a stay — and it handed the final night of every booking
   * back to the calendar as free. A 15–20 August reservation showed the 19th as
   * open, and a broker could have held a night the estate had already sold.
   *
   * Note this is the opposite convention to our own BrokerHold, whose checkOut
   * IS the departure day, so there the last occupied night is the one before it.
   * The two are not interchangeable; don't unify these loops.
   */
  private static eachNight(start: string, end: string): string[] {
    const out: string[] = [];
    const cursor = new Date(`${start}T00:00:00`);
    const stop = new Date(`${end}T00:00:00`);
    while (cursor <= stop) {
      out.push(LodgifyService.day(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  /**
   * The nights the villa cannot be sold, as YYYY-MM-DD.
   *
   * Deliberately read from Lodgify rather than from our own Booking table.
   * Lodgify also knows about owner stays, maintenance blocks and reservations
   * that arrived through a channel and never synced to us as a Booking — all
   * of which our table would happily report as free.
   *
   * Throws on failure rather than returning an empty set. An availability
   * calendar that silently shows a fully-booked month as wide open is worse
   * than one that admits it can't answer.
   */
  async getUnavailableNights(from: Date, to: Date): Promise<Set<string>> {
    const start = LodgifyService.day(from);
    const end = LodgifyService.day(to);

    return this.cached(`avail:${start}:${end}`, async () => {
      const response = await this.client.get(
        '/availability/' + this.propertyId(),
        {
          params: { start, end, includeDetails: false },
        },
      );

      const blocked = new Set<string>();

      // Lodgify answers in periods, not days: an array of property entries,
      // each with `periods`, each period carrying `available` as 0 or 1. We
      // flatten to nights because that's what a calendar cell needs, and
      // because it makes the shape of the payload irrelevant downstream.
      const entries = Array.isArray(response.data)
        ? response.data
        : [response.data];

      for (const entry of entries) {
        const periods = (entry as { periods?: unknown })?.periods;
        if (!Array.isArray(periods)) continue;

        for (const period of periods) {
          const p = period as {
            start?: string;
            end?: string;
            available?: number;
          };
          if (!p.start || !p.end) continue;
          if (Number(p.available) !== 0) continue;
          for (const night of LodgifyService.eachNight(p.start, p.end)) {
            blocked.add(night);
          }
        }
      }

      this.logger.log(
        `Lodgify availability ${start}→${end}: ${blocked.size} nights unavailable`,
      );
      return blocked;
    });
  }

  /**
   * What Lodgify charges per night, and on what terms.
   *
   * The shape here is written against a real response, not the documentation.
   * Two earlier readings of the docs were wrong — the availability period end
   * turned out inclusive, and this call turned out to need a room type — so
   * what follows describes what Lodgify actually sends:
   *
   *   { calendar_items: [
   *       { date: null, is_default: true, prices: [...] },   // the fallback
   *       { date: "2026-08-20", is_default: false, prices: [
   *           { min_stay: 3, max_stay: 1125, price_per_day: 6500, ... } ] },
   *     ],
   *     rate_settings: {...} }
   *
   * The price is two levels down, `prices` is a list of stay-length tiers, and
   * the first row carries no date at all. Anything reading `item.price` — as
   * the first implementation did — finds nothing and reports the estate as
   * unpriced, which is exactly what happened.
   *
   * `currency` is read rather than assumed. A bare 6500 is meaningless until
   * you know whether it's dollars or pesos, and the two differ by a factor of
   * roughly eighteen — so where the currency can't be established, the caller
   * treats every night as unpriced. A calendar with no prices is recoverable;
   * a broker quoting pesos as dollars to their client is not.
   */
  async getRateCalendar(
    from: Date,
    to: Date,
  ): Promise<{
    nights: Map<string, { rate: number; minStay?: number }>;
    currency: string | null;
  }> {
    const start = LodgifyService.day(from);
    const end = LodgifyService.day(to);

    return this.cached(`rates:${start}:${end}`, async () => {
      const nights = new Map<string, { rate: number; minStay?: number }>();
      let currency: string | null = null;

      try {
        // Lodgify prices per room type, and refuses the whole request without
        // one — "Request model is not valid. All fields are required."
        const roomTypeId = await this.roomTypeId();
        if (!roomTypeId) {
          this.logger.warn(
            'No Lodgify room type id — rates cannot be requested. Set LODGIFY_ROOM_TYPE_ID to pin one.',
          );
          return { nights, currency };
        }

        const response = await this.client.get('/rates/calendar', {
          params: {
            RoomTypeId: roomTypeId,
            HouseId: this.propertyId(),
            StartDate: start,
            EndDate: end,
          },
        });

        const payload = (response.data ?? {}) as Record<string, unknown>;
        const items = Array.isArray(payload)
          ? payload
          : ((payload['calendar_items'] as unknown[]) ?? []);

        if (!Array.isArray(items)) return { nights, currency };

        currency = LodgifyService.readCurrency(payload);

        /**
         * A date's price is the cheapest tier the guest could qualify for, and
         * its minimum stay is what qualifying costs them. `min_stay: 3` beside
         * `price_per_day: 6500` means "three nights or more, at 6,500" — so the
         * two travel together and picking a rate without its minimum would
         * quote a price on terms nobody offered.
         */
        const cheapestTier = (
          prices: unknown,
        ): { rate: number; minStay?: number } | null => {
          if (!Array.isArray(prices)) return null;

          let best: { rate: number; minStay?: number } | null = null;
          for (const entry of prices) {
            const e = entry as Record<string, unknown>;
            const rate = Number(e['price_per_day'] ?? e['price'] ?? e['rate']);
            if (!Number.isFinite(rate) || rate <= 0) continue;

            const rawMin = Number(e['min_stay'] ?? e['minStay']);
            const minStay =
              Number.isFinite(rawMin) && rawMin > 0 ? rawMin : undefined;

            if (!best || (minStay ?? 0) < (best.minStay ?? 0)) {
              best = { rate, ...(minStay ? { minStay } : {}) };
            }
          }
          return best;
        };

        // The row with no date is Lodgify's default, applying to any date it
        // didn't list. Kept as a fallback rather than discarded — and never
        // written to a date, since it has none.
        let fallback: { rate: number; minStay?: number } | null = null;

        for (const item of items) {
          const row = item as Record<string, unknown>;
          const tier = cheapestTier(row['prices']);
          if (!tier) continue;

          const date =
            typeof row['date'] === 'string' ? row['date'].slice(0, 10) : null;
          if (!date) {
            if (row['is_default'] === true) fallback = tier;
            continue;
          }
          nights.set(date, tier);
        }

        if (fallback) {
          for (let c = new Date(from); c < to; c.setDate(c.getDate() + 1)) {
            const date = LodgifyService.day(c);
            if (!nights.has(date)) nights.set(date, fallback);
          }
        }

        // The rental's own currency is authoritative — it's the value the
        // estate set in Lodgify's Pricing screen — and the rates payload
        // doesn't carry one, so this request is how we learn it.
        if (nights.size > 0 && !currency) {
          currency = await this.propertyCurrency();
        }

        this.logger.log(
          `Lodgify rates ${start}→${end}: ${nights.size} nights priced${
            currency ? ` in ${currency}` : ', currency unknown'
          }`,
        );
      } catch (error) {
        // Not configured, or the plan doesn't expose rates. Neither is an
        // error the broker should see — the page renders without prices.
        this.logger.warn(
          `Lodgify rates unavailable (${start}→${end}): ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }

      return { nights, currency };
    });
  }

  /** An ISO currency code from whichever key this payload happens to use. */
  private static readCurrency(source: Record<string, unknown>): string | null {
    for (const k of ['currency_code', 'currencyCode', 'currency']) {
      const v = source[k];
      if (typeof v === 'string' && /^[A-Za-z]{3}$/.test(v.trim())) {
        return v.trim().toUpperCase();
      }
    }
    return null;
  }

  /**
   * The rental's room type, which the rates calendar refuses to answer without.
   *
   * Discovered from the property rather than configured, so the estate never
   * has to find an id in an API response — but LODGIFY_ROOM_TYPE_ID pins it if
   * the villa ever has more than one and the wrong one gets picked.
   */
  private async roomTypeId(): Promise<string | null> {
    const pinned = this.config.get<string>('LODGIFY_ROOM_TYPE_ID')?.trim();
    if (pinned) return pinned;

    return this.cached('roomTypeId', async () => {
      try {
        const res = await this.client.get(`/properties/${this.propertyId()}`);
        const rooms = (res.data as { rooms?: { id?: unknown }[] })?.rooms;
        const id = Array.isArray(rooms) ? rooms[0]?.id : undefined;
        return id == null ? null : String(id);
      } catch {
        return null;
      }
    });
  }

  /** The rental's configured currency, cached alongside the rates. */
  private async propertyCurrency(): Promise<string | null> {
    return this.cached('currency', async () => {
      try {
        const res = await this.client.get(`/properties/${this.propertyId()}`);
        return LodgifyService.readCurrency(
          (res.data ?? {}) as Record<string, unknown>,
        );
      } catch {
        return null;
      }
    });
  }

  private propertyId(): string {
    return String(this.config.get('LODGIFY_PROPERTY_ID') ?? '');
  }

  extractWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const msSignature = this.getHeader(headers, 'ms-signature');
    if (msSignature) return msSignature;

    return this.getHeader(headers, 'x-lodgify-signature');
  }

  validateWebhookSignature(
    payload: Buffer | string,
    signature?: string,
  ): boolean {
    const secret = this.getWebhookSecret();

    if (!secret) {
      // In production a missing secret must REJECT — never accept unverified
      // webhooks. Only skip in non-production for local testing.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          'LODGIFY_WEBHOOK_SECRET is not set — rejecting webhook in production',
        );
        return false;
      }
      this.logger.warn(
        'LODGIFY_WEBHOOK_SECRET is not set — skipping validation (non-production only)',
      );
      return true;
    }

    if (!signature) {
      this.logger.warn(
        'Missing Lodgify webhook signature (Ms-Signature or x-lodgify-signature)',
      );
      return false;
    }

    const payloadBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload, 'utf8');

    const expectedHex = crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');

    const expectedPrefixed = `sha256=${expectedHex}`;

    const received = signature.trim();
    const receivedHex = received.startsWith('sha256=')
      ? received.slice('sha256='.length)
      : received;

    if (
      this.safeEqual(received.toLowerCase(), expectedPrefixed.toLowerCase()) ||
      this.safeEqual(receivedHex.toLowerCase(), expectedHex.toLowerCase())
    ) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(
        `Lodgify signature mismatch (rawBody ${payloadBuffer.length} bytes, secret ${secret.length} chars, expected ${expectedHex.slice(0, 12)}..., received ${receivedHex.slice(0, 12)}...)`,
      );
    }

    return false;
  }

  private getWebhookSecret(): string | undefined {
    const secret = this.config.get<string>('LODGIFY_WEBHOOK_SECRET')?.trim();
    return secret || undefined;
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
