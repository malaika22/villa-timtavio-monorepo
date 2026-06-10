import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { LodgifyService } from './lodgify.service';
import { BookingsService } from '../bookings/bookings.service';

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
        await this.bookingsService.syncFromLodgify(booking);
      } catch (err: any) {
        this.logger.error(
          `Failed to sync booking ${booking.id}: ${err.message}`,
        );
      }
    }
  }
}
