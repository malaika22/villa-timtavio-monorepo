import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';

@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private magicLinkService: MagicLinkService,
  ) {}

  // ─── Send magic links 24 hours before check-in (runs hourly) ─────────────

  @Cron(CronExpression.EVERY_HOUR)
  async sendPreArrivalLinks() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: in24h, lt: in25h },
      },
      include: { primaryGuest: true },
    });

    this.logger.log(`Pre-arrival scheduler: found ${bookings.length} bookings`);

    for (const booking of bookings) {
      await this.magicLinkService.sendMagicLink({
        email: booking.primaryGuest.email,
        firstName: booking.primaryGuest.firstName,
        lastName: booking.primaryGuest.lastName,
        bookingId: booking.id,
        role: 'primary_member',
        guestTier: 'primary',
        checkOutDate: booking.checkOut,
      });
    }
  }

  // ─── Auto check-in once the stay has started (runs hourly) ────────────────
  // Without this, confirmed bookings never transition to CHECKED_IN on their
  // own, so guest-facing features that unlock on arrival (e.g. experiences)
  // stay locked for the whole stay. Mirrors the date-driven departure job.

  @Cron(CronExpression.EVERY_HOUR)
  async autoCheckIn() {
    const now = new Date();
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        checkIn: { lte: now },
        checkOut: { gte: now },
      },
      data: { status: 'CHECKED_IN' },
    });

    if (result.count > 0) {
      this.logger.log(`Auto checked-in ${result.count} booking(s)`);
    }
  }

  // ─── Set departure today flag (runs at 6am daily) ─────────────────────────

  @Cron('0 6 * * *')
  async setDepartureToday() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const count = await this.prisma.booking.updateMany({
      where: {
        checkOut: { gte: todayStart, lte: todayEnd },
        status: { in: ['CHECKED_IN', 'SETTLED'] },
      },
      data: { status: 'DEPARTURE_TODAY' },
    });

    if (count.count > 0) {
      this.logger.log(`Set DEPARTURE_TODAY for ${count.count} bookings`);
    }
  }

  // ─── Revoke access 24 hours after checkout (runs hourly) ─────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async revokeExpiredAccess() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'CHECKED_OUT',
        stripeCapturedAt: {
          gte: twentyFiveHoursAgo,
          lt: twentyFourHoursAgo,
        },
      },
    });

    for (const booking of bookings) {
      await this.magicLinkService.revokeBookingAccess(booking.id);
    }
  }
}
