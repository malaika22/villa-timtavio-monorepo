import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { LodgifyService } from './lodgify.service';
import { BookingsService } from '../bookings/bookings.service';
import { normalizeLodgifyBooking } from './lodgify-booking.mapper';

@Processor('lodgify-sync')
export class LodgifyProcessor {
  private readonly logger = new Logger(LodgifyProcessor.name);

  constructor(
    private lodgifyService: LodgifyService,
    private bookingsService: BookingsService,
  ) {}

  @Process('sync-all')
  async syncAll(job: Job) {
    this.logger.log('Running Lodgify sync');
    const response = await this.lodgifyService.getBookings();
    const bookings = response.items || [];

    for (const booking of bookings) {
      try {
        // Normalize the raw Lodgify API shape (guest.name, etc.) into our
        // sync payload — same mapper the webhook path uses — so the guest's
        // real name flows through instead of defaulting to "Guest".
        const payload = normalizeLodgifyBooking(booking);
        if (!payload) {
          this.logger.warn(
            `Skipped Lodgify booking ${booking?.id}: missing id/dates/email`,
          );
          continue;
        }
        await this.bookingsService.syncFromLodgify(payload);
      } catch (err: any) {
        this.logger.error(
          `Failed to sync booking ${booking?.id}: ${err.message}`,
        );
      }
    }
  }
}
