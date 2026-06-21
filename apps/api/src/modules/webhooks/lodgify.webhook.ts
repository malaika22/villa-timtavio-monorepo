import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Logger,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { LodgifyService } from '../lodgify/lodgify.service';
import {
  extractBookingIdFromWebhook,
  isLodgifyBookingCancelEvent,
  isLodgifyBookingCreateEvent,
  isLodgifyBookingUpdateEvent,
  normalizeLodgifyWebhookEntry,
  parseLodgifyWebhookPayload,
  type LodgifyWebhookEntry,
} from '../lodgify/lodgify-booking.mapper';
import { BookingsService } from '../bookings/bookings.service';

@Controller('webhooks/lodgify')
export class LodgifyWebhookController {
  private readonly logger = new Logger(LodgifyWebhookController.name);

  constructor(
    private lodgifyService: LodgifyService,
    private bookingsService: BookingsService,
  ) {}

  @Post()
  @Public()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    if (!req.rawBody?.length) {
      this.logger.warn(
        'Lodgify webhook missing raw request body — cannot verify signature',
      );
      return { received: false };
    }

    const signature = this.lodgifyService.extractWebhookSignature(headers);

    if (
      !this.lodgifyService.validateWebhookSignature(req.rawBody, signature)
    ) {
      this.logger.warn('Invalid Lodgify webhook signature');
      return { received: false };
    }

    let body: unknown;
    try {
      body = JSON.parse(req.rawBody.toString('utf8'));
    } catch {
      this.logger.warn('Lodgify webhook body is not valid JSON');
      return { received: false };
    }

    const entries = parseLodgifyWebhookPayload(body);

    if (entries.length === 0) {
      this.logger.warn('Lodgify webhook received with no parseable entries');
      return { received: true };
    }

    for (const entry of entries) {
      this.logger.log(`Lodgify webhook received: ${entry.action}`);

      try {
        await this.processEntry(entry);
      } catch (error) {
        this.logger.error(
          `Error processing Lodgify webhook entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { received: true };
  }

  private async processEntry(entry: LodgifyWebhookEntry): Promise<void> {
    const { action } = entry;

    if (isLodgifyBookingCancelEvent(action)) {
      const bookingId = extractBookingIdFromWebhook(entry.raw);
      if (bookingId) {
        await this.bookingsService.cancelFromLodgify({ id: bookingId });
      }
      return;
    }

    if (
      !isLodgifyBookingCreateEvent(action) &&
      !isLodgifyBookingUpdateEvent(action)
    ) {
      this.logger.log(`Unhandled Lodgify event: ${action}`);
      return;
    }

    const payload = await this.resolveBookingPayload(entry);
    if (!payload) {
      this.logger.warn(`No booking payload resolved for event ${action}`);
      return;
    }

    await this.bookingsService.syncFromLodgify(payload);
  }

  private async resolveBookingPayload(entry: LodgifyWebhookEntry) {
    const embedded = normalizeLodgifyWebhookEntry(entry);
    if (embedded) {
      return embedded;
    }

    const bookingId = extractBookingIdFromWebhook(entry.raw);
    if (!bookingId) {
      return null;
    }

    return this.lodgifyService.fetchBookingForSync(bookingId);
  }
}
