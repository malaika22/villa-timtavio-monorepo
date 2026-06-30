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
