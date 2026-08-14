import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

import {
  normalizeLodgifyBooking,
  type LodgifySyncPayload,
} from './lodgify-booking.mapper';

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
      const response = await this.client.get('/availability/' + this.propertyId(), {
        params: { start, end, includeDetails: false },
      });

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
          const p = period as { start?: string; end?: string; available?: number };
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
   * Nightly rate per date, where Lodgify has one configured.
   *
   * Returns an empty map rather than throwing when rates aren't set up — the
   * estate hasn't filled them in yet, and a broker page that refuses to render
   * because a price is missing helps nobody. Callers fall back to the estate's
   * own season table and label the figure as indicative.
   */
  async getNightlyRates(from: Date, to: Date): Promise<Map<string, number>> {
    const start = LodgifyService.day(from);
    const end = LodgifyService.day(to);

    return this.cached(`rates:${start}:${end}`, async () => {
      const rates = new Map<string, number>();

      try {
        const response = await this.client.get('/rates/calendar', {
          params: {
            HouseId: this.propertyId(),
            StartDate: start,
            EndDate: end,
          },
        });

        const items = Array.isArray(response.data)
          ? response.data
          : ((response.data as { calendar_items?: unknown })?.calendar_items ??
            []);

        if (!Array.isArray(items)) return rates;

        for (const item of items) {
          const r = item as { date?: string; price?: number; min_stay?: number };
          const price = Number(r.price);
          if (!r.date || !Number.isFinite(price) || price <= 0) continue;
          rates.set(r.date.slice(0, 10), price);
        }

        this.logger.log(
          `Lodgify rates ${start}→${end}: ${rates.size} nights priced`,
        );
      } catch (error) {
        // Not configured, or the plan doesn't expose rates. Neither is an
        // error the broker should see — the season fallback covers it.
        this.logger.warn(
          `Lodgify rates unavailable (${start}→${end}): ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      }

      return rates;
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
