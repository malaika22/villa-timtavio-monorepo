import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';

@Injectable()
export class BookingsScheduler implements OnModuleInit {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private magicLinkService: MagicLinkService,
  ) {}

  // Populate reminder alerts on boot so the EM bell reflects reality
  // immediately rather than waiting for the next scheduled run.
  async onModuleInit() {
    await this.syncStayReminderAlerts().catch((err) =>
      this.logger.error('Initial reminder sync failed', err),
    );
  }

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

  // ─── Check-in / check-out are MANUAL actions by the estate manager ────────
  // We intentionally do NOT auto check-in or check-out. Instead we persist
  // dismissible SystemAlerts (category REMINDER) so the dashboard banner AND
  // the notification bell flag stays whose dates have passed but whose status
  // hasn't been advanced yet. The sync is self-healing: alerts are created for
  // newly-overdue bookings and auto-dismissed once the EM updates the status.

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncStayReminderAlerts() {
    const now = new Date();

    const [awaitingCheckIn, awaitingCheckOut] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          checkIn: { lte: now },
          checkOut: { gte: now },
        },
        include: { primaryGuest: true },
      }),
      this.prisma.booking.findMany({
        where: {
          status: { in: ['CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'] },
          checkOut: { lt: now },
        },
        include: { primaryGuest: true },
      }),
    ]);

    await Promise.all([
      this.reconcileReminderType(
        'check-in',
        awaitingCheckIn,
        (b) =>
          `${b.primaryGuest.firstName} ${b.primaryGuest.lastName} has arrived but isn't checked in yet — confirm check-in.`,
        'Guest awaiting check-in',
      ),
      this.reconcileReminderType(
        'check-out',
        awaitingCheckOut,
        (b) =>
          `${b.primaryGuest.firstName} ${b.primaryGuest.lastName}'s stay has ended — mark as checked out.`,
        'Stay awaiting check-out',
      ),
    ]);
  }

  private async reconcileReminderType(
    entityType: 'check-in' | 'check-out',
    overdue: { id: string; primaryGuest: { firstName: string; lastName: string } }[],
    message: (b: {
      primaryGuest: { firstName: string; lastName: string };
    }) => string,
    title: string,
  ) {
    const overdueIds = new Set(overdue.map((b) => b.id));

    const existing = await this.prisma.systemAlert.findMany({
      where: { category: 'REMINDER', entityType, isDismissed: false },
    });
    const existingIds = new Set(existing.map((a) => a.entityId));

    // Create alerts for newly-overdue bookings.
    const toCreate = overdue.filter((b) => !existingIds.has(b.id));
    if (toCreate.length > 0) {
      await this.prisma.systemAlert.createMany({
        data: toCreate.map((b) => ({
          severity: 'WARNING',
          title,
          message: message(b),
          category: 'REMINDER',
          entityType,
          entityId: b.id,
        })),
      });
    }

    // Auto-dismiss alerts whose booking is no longer overdue (status advanced).
    const toDismiss = existing.filter((a) => !overdueIds.has(a.entityId ?? ''));
    if (toDismiss.length > 0) {
      await this.prisma.systemAlert.updateMany({
        where: { id: { in: toDismiss.map((a) => a.id) } },
        data: { isDismissed: true, dismissedAt: new Date(), dismissedBy: 'system' },
      });
    }

    const changed = toCreate.length + toDismiss.length;
    if (changed > 0) {
      this.logger.log(
        `Reminder sync (${entityType}): +${toCreate.length} / -${toDismiss.length}`,
      );
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
