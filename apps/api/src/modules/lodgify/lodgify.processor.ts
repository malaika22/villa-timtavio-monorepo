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

    let failures = 0;

    for (const booking of bookings) {
      try {
        // Normalize the raw Lodgify API shape (guest.name, etc.) into our
        // sync payload — same mapper the webhook path uses — so the guest's
        // real name flows through instead of defaulting to "Guest".
        const payload = normalizeLodgifyBooking(booking);
        if (!payload) {
          // Skipping isn't enough on its own. A reservation that was booked
          // and later declined has already been synced, and merely ignoring it
          // from here leaves it CONFIRMED in the estate's records for ever —
          // which is how a declined stay came to sit in Guests as an arriving
          // party while the calendar sold the same nights.
          //
          // The deletion reconciler can't reach it either: it cancels bookings
          // that have vanished from Lodgify, and this one is still returned.
          await this.bookingsService.cancelIfNoLongerAStay(
            booking?.id,
            typeof booking?.status === 'string' ? booking.status : 'not a stay',
          );
          this.logger.warn(
            `Skipped Lodgify booking ${booking?.id}: ${booking?.status ?? 'missing id/dates/email'}`,
          );
          continue;
        }
        await this.bookingsService.syncFromLodgify(payload);
      } catch (err: any) {
        failures++;
        this.logger.error(
          `Failed to sync booking ${booking?.id}: ${err.message}`,
        );
      }
    }

    // Reservations deleted in Lodgify send no webhook — they just stop being
    // returned — so absences have to be reconciled here or their records live
    // on as phantom "current" bookings.
    //
    // Only on a clean pass. If any booking failed to sync we can't tell a
    // deletion from a row we simply failed to process, and the cost of getting
    // that wrong is cancelling a live stay.
    if (failures > 0) {
      this.logger.warn(
        `${failures} booking(s) failed to sync — skipping deletion reconciliation`,
      );
      return;
    }

    // Absence from this page nominates a candidate; it no longer convicts one.
    // Each is confirmed against Lodgify directly before anything is cancelled.
    await this.bookingsService.reconcileDeletedFromLodgify(bookings, (id) =>
      this.lodgifyService.confirmReservation(id),
    );
  }
}
