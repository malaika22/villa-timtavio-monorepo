import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';
import { BookingStatus } from '@prisma/client';
import { InquiriesService } from '../inqueries/inquiries.service';
import { PusherService } from '../pusher/pusher.service';
import { PaymentsService } from '../payments/payments.service';
import { realFirstName } from '../../commons/utils/name.util';

/** Matches the `size` LodgifyService requests; a full page means truncation. */
const LODGIFY_PAGE_SIZE = 100;
/** How settled a booking must be before absence counts as deletion. */
const RECONCILE_GRACE_MS = 10 * 60 * 1000;

/**
 * Which of several competing bookings the estate manager actually needs to see:
 * the one with real activity on it. Manifest progress first, then party size,
 * then the latest check-in.
 */
function byRealActivity(
  a: { manifestStatus: string; manifestGuests: unknown[]; checkIn: Date },
  b: { manifestStatus: string; manifestGuests: unknown[]; checkIn: Date },
): number {
  const rank = (s: string) =>
    s === 'SUBMITTED' ? 3 : s === 'APPROVED' ? 2 : s === 'IN_PROGRESS' ? 1 : 0;
  const byManifest = rank(b.manifestStatus) - rank(a.manifestStatus);
  if (byManifest !== 0) return byManifest;
  const byGuests = b.manifestGuests.length - a.manifestGuests.length;
  if (byGuests !== 0) return byGuests;
  return b.checkIn.getTime() - a.checkIn.getTime();
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private magicLinkService: MagicLinkService,
    private inquiriesService: InquiriesService,
    private pusherService: PusherService,
    private paymentsService: PaymentsService,
  ) {}

  /** Place the deposit hold for a booking (EM-triggerable). */
  createDepositHold(bookingId: string) {
    return this.paymentsService.createDepositHold(bookingId);
  }

  // ─── Get current booking for guest ───────────────────────────────────────────

  // ─── Get current active booking for the estate manager ──────────────────────
  // Unlike the guest-scoped current booking, the EM oversees the whole villa, so
  // we surface the most relevant booking: checked-in now, else the next arrival,
  // else the most recent.

  /**
   * One booking, in the shape the dashboard's stay view expects.
   *
   * Extracted so the EM can look at a booking they choose. Everything on that
   * page — including manifest approval — used to run off whichever booking
   * `getCurrentActiveForEm` picked, so a party planning months ahead could
   * submit a manifest nobody could reach, and their secondaries never got
   * their links.
   */
  async getForEm(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.emStayInclude(),
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.withPrimaryLinkSent(booking);
  }

  private emStayInclude() {
    return {
      primaryGuest: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          dietaryRestrictions: true,
          allergies: true,
          beveragePreferences: true,
          winePreferences: true,
        },
      },
      manifestGuests: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          roomNumber: true,
          relationship: true,
          dietaryRestrictions: true,
          dietaryOtherDetails: true,
          allergies: true,
          beveragePreferences: true,
          specialNotes: true,
          pwaLinkSent: true,
        },
      },
      experienceRequests: {
        select: {
          id: true,
          status: true,
          preferredDate: true,
          confirmedDate: true,
          guestCount: true,
          catalogItem: { select: { name: true } },
        },
        orderBy: { preferredDate: 'asc' as const },
      },
    };
  }

  async getCurrentActiveForEm() {
    const include = this.emStayInclude();

    // 1) Currently checked-in. With overlapping test bookings there can be more
    // than one, so prefer the booking the EM actually needs to act on: the one
    // with the most manifest activity, then the most guests, then most recent.
    const checkedIn = await this.prisma.booking.findMany({
      where: { status: 'CHECKED_IN' },
      include,
    });
    if (checkedIn.length > 0) {
      checkedIn.sort(byRealActivity);
      return this.withPrimaryLinkSent(checkedIn[0]!);
    }

    // 2) Next upcoming arrival
    const upcoming = await this.prisma.booking.findFirst({
      where: { status: 'CONFIRMED', checkIn: { gte: new Date() } },
      orderBy: { checkIn: 'asc' },
      include,
    });
    if (upcoming) return this.withPrimaryLinkSent(upcoming);

    // 3) Still-active bookings as a fallback. This used to take the first row
    // ordered by checkIn alone — with several bookings sharing a check-in date
    // that is a tie, so Postgres returned an arbitrary one and the EM could
    // land on an empty duplicate while the guest's manifest sat on another.
    // Rank by real activity first, exactly as the checked-in branch does.
    const active = await this.prisma.booking.findMany({
      where: { status: { notIn: ['CHECKED_OUT', 'CANCELLED'] } },
      include,
    });
    if (active.length === 0) return null;
    active.sort(byRealActivity);
    return this.withPrimaryLinkSent(active[0]!);
  }

  // The primary's access link isn't a manifestGuest.pwaLinkSent (those are
  // secondaries) — it's tracked as a MagicToken for the booking. Surface whether
  // one exists so the pre-arrival checklist's "Magic link sent" item is accurate.
  private async withPrimaryLinkSent<T extends { id: string }>(booking: T) {
    const token = await this.prisma.magicToken.findFirst({
      where: { bookingId: booking.id },
      select: { id: true },
    });
    return { ...booking, primaryLinkSent: !!token };
  }

  async getCurrentForGuest(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dietaryRestrictions: true,
            allergies: true,
          },
        },
        manifestGuests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            roomNumber: true,
            pwaLinkSent: true,
          },
        },
      },
    });
  }

  // ─── Update guest state ───────────────────────────────────────────────────────

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    updatedBy: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'BOOKING_STATUS_CHANGED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: updatedBy,
        performedByRole: 'estate_manager',
        bookingId,
        beforeState: { status: booking.status } as any,
        afterState: { status } as any,
      },
    });

    if (status === 'CHECKED_IN') {
      await this.pusherService.bookingArrivedToEm({
        bookingId,
        guestName: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`,
        partySize: booking.totalGuests,
      });
    }

    await this.pusherService.bookingStatusChanged(bookingId, {
      status,
    });

    return updated;
  }

  // ─── Sync from Lodgify ────────────────────────────────────────────────────────

  async syncFromLodgify(lodgifyData: any) {
    const existing = await this.prisma.booking.findUnique({
      where: { lodgifyId: String(lodgifyData.id) },
    });

    if (existing) {
      const updated = await this.updateFromLodgify(lodgifyData);
      const guestEmail = lodgifyData.guest?.email;
      if (guestEmail) {
        await this.inquiriesService.linkToBooking(guestEmail, existing.id);
      }
      return updated;
    }

    // Find or create primary guest
    const guestEmail = lodgifyData.guest?.email;
    if (!guestEmail) {
      this.logger.warn(`Lodgify booking ${lodgifyData.id} has no guest email`);
      return;
    }

    let guest = await this.prisma.guest.findUnique({
      where: { email: guestEmail },
    });

    // Seed/backfill the guest name. Lodgify often has no name (defaults to the
    // "Guest" placeholder), so fall back to the linked inquiry's real name.
    if (!guest || !realFirstName(guest.firstName)) {
      const inquiry = await this.inquiriesService.findLatestByEmail(guestEmail);
      const firstName =
        lodgifyData.guest?.first_name || inquiry?.firstName || 'Guest';
      const lastName = lodgifyData.guest?.last_name || inquiry?.lastName || '';

      if (!guest) {
        guest = await this.prisma.guest.create({
          data: {
            email: guestEmail,
            firstName,
            lastName,
            phone: lodgifyData.guest?.phone,
            role: 'PRIMARY',
          },
        });
      } else {
        guest = await this.prisma.guest.update({
          where: { id: guest.id },
          data: { firstName, lastName },
        });
      }
    }

    // Snapshot the estate's configured tax/service rates onto the booking at
    // creation. The folio reads the booking's own rates, so this makes the
    // Settings → Pricing values actually apply to new stays, while past/settled
    // bookings keep whatever they were quoted. Falls back to the EstateSettings
    // defaults (0.16) when the singleton row hasn't been created yet.
    const pricing = await this.prisma.estateSettings.findUnique({
      where: { id: 'singleton' },
      select: { taxRate: true, serviceChargeRate: true },
    });

    const booking = await this.prisma.booking.create({
      data: {
        lodgifyId: String(lodgifyData.id),
        lodgifyRawData: lodgifyData,
        checkIn: new Date(lodgifyData.arrival),
        checkOut: new Date(lodgifyData.departure),
        nights: lodgifyData.nights || 1,
        totalGuests: lodgifyData.people_count || 1,
        baseRate: lodgifyData.total_price || 0,
        taxRate: pricing?.taxRate ?? 0.16,
        serviceChargeRate: pricing?.serviceChargeRate ?? 0.16,
        status: 'CONFIRMED',
        manifestStatus: 'INCOMPLETE',
        primaryGuestId: guest.id,
      },
    });

    if (guestEmail) {
      await this.inquiriesService.linkToBooking(guestEmail, booking.id);
    }

    // Place the 50% deposit hold (best-effort, guarded — never blocks sync).
    await this.paymentsService
      .createDepositHold(booking.id)
      .catch((err) =>
        this.logger.error(`Deposit hold failed: ${String(err)}`),
      );

    this.logger.log(
      `Synced booking ${booking.id} from Lodgify ${lodgifyData.id}`,
    );

    // Add base rate folio item
    await this.prisma.folioItem.create({
      data: {
        bookingId: booking.id,
        type: 'ESTATE_BASE_RATE',
        description: `Villa TimTavio Estate — ${booking.nights} nights`,
        amount: booking.baseRate,
        quantity: 1,
        loggedBy: 'system',
        loggedAt: new Date(),
        editableUntil: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // Send the magic link now if the stay is imminent or already under way.
    //
    // This used to require check-in to be strictly in the FUTURE, so a booking
    // made on the day of arrival — after the check-in time had passed — fell
    // through: the guest was already at the estate and got nothing until the
    // 30-minute catch-up cron happened to run. The window now matches the
    // scheduler's: arriving within 24h, or arrived and not yet departed.
    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const stayIsImminentOrActive =
      booking.checkIn.getTime() <= in24h && booking.checkOut.getTime() > now;

    if (stayIsImminentOrActive) {
      await this.magicLinkService.sendMagicLink({
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        bookingId: booking.id,
        role: 'primary_member',
        guestTier: 'primary',
        checkOutDate: booking.checkOut,
      });
    }

    // Nothing else is emailed at booking time. The guest's confirmation is the
    // lookbook + payment link Rodrigo sends from the inquiry, which carries the
    // reservation details and the Stripe link together.

    return booking;
  }

  async updateFromLodgify(lodgifyData: any) {
    const baseRate =
      lodgifyData.total_price != null
        ? Number(lodgifyData.total_price)
        : undefined;

    const peopleCount = Number(lodgifyData.people_count);
    const booking = await this.prisma.booking.update({
      where: { lodgifyId: String(lodgifyData.id) },
      data: {
        checkIn: new Date(lodgifyData.arrival),
        checkOut: new Date(lodgifyData.departure),
        nights: lodgifyData.nights,
        ...(Number.isFinite(peopleCount) && peopleCount > 0
          ? { totalGuests: peopleCount }
          : {}),
        ...(baseRate != null ? { baseRate } : {}),
        lodgifyRawData: lodgifyData,
      },
    });

    // Backfill the primary guest's real name when it's still the "Guest"
    // placeholder (Lodgify now provides it, or the linked inquiry does).
    const full = await this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: { primaryGuest: true },
    });
    const g = full?.primaryGuest;
    if (g && !realFirstName(g.firstName)) {
      const inquiry = await this.inquiriesService.findLatestByEmail(g.email);
      const firstName =
        realFirstName(lodgifyData.guest?.first_name) ??
        realFirstName(inquiry?.firstName ?? undefined) ??
        g.firstName;
      const lastName =
        lodgifyData.guest?.last_name || inquiry?.lastName || g.lastName;
      if (realFirstName(firstName)) {
        await this.prisma.guest.update({
          where: { id: g.id },
          data: { firstName, lastName },
        });
      }
    }

    // Keep the base-rate folio line in sync with the (possibly changed) total.
    if (baseRate != null) {
      const existing = await this.prisma.folioItem.findFirst({
        where: { bookingId: booking.id, type: 'ESTATE_BASE_RATE' },
      });
      if (existing) {
        await this.prisma.folioItem.update({
          where: { id: existing.id },
          data: {
            amount: baseRate,
            description: `Villa TimTavio Estate — ${booking.nights} nights`,
          },
        });
      } else {
        await this.prisma.folioItem.create({
          data: {
            bookingId: booking.id,
            type: 'ESTATE_BASE_RATE',
            description: `Villa TimTavio Estate — ${booking.nights} nights`,
            amount: baseRate,
            quantity: 1,
            loggedBy: 'system',
            loggedAt: new Date(),
            editableUntil: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
      }
    }

    return booking;
  }

  /**
   * Mark bookings cancelled when they have disappeared from Lodgify.
   *
   * Deleting a reservation in Lodgify — as opposed to declining it — fires no
   * webhook. It simply stops appearing in the poll, so our copy sat at
   * CONFIRMED indefinitely; that is how four phantom bookings ended up
   * competing to be the estate's "current" stay.
   *
   * This is the one place the sync DELETES information rather than adding it,
   * and "Lodgify didn't mention it" is indistinguishable from "Lodgify didn't
   * tell us everything". So it refuses to act whenever the response could be
   * incomplete, and only ever judges bookings inside the date range the
   * response actually covered. Set LODGIFY_RECONCILE_DELETIONS=false to
   * disable it entirely without a deploy.
   */
  /**
   * Cancels a booking Lodgify still returns but no longer counts as a stay.
   *
   * Declined and open reservations reach us through the same list as real
   * ones, so the deletion reconciler — which looks for absence — never sees
   * them. This is the other half: Lodgify has told us plainly what the
   * reservation is, so there is no ambiguity to be careful about and no need
   * for the guards that surround a judgement made from silence.
   *
   * Idempotent, because the poller runs every five minutes and will hand us
   * the same declined reservation each time until somebody deletes it there.
   */
  async cancelIfNoLongerAStay(
    lodgifyId: unknown,
    reason: string,
  ): Promise<boolean> {
    if (lodgifyId == null) return false;

    const booking = await this.prisma.booking.findUnique({
      where: { lodgifyId: String(lodgifyId) },
      select: { id: true, status: true },
    });

    // Already cancelled, or a reservation we never synced in the first place.
    if (!booking || booking.status === 'CANCELLED') return false;

    // A stay the guest is already on, or has finished, is not something to
    // undo from a status field — the estate housed them.
    if (
      booking.status === 'CHECKED_IN' ||
      booking.status === 'CHECKED_OUT' ||
      booking.status === 'SETTLED' ||
      booking.status === 'DEPARTURE_TODAY'
    ) {
      this.logger.warn(
        `Lodgify reports ${lodgifyId} as "${reason}", but the stay is ${booking.status} — left alone`,
      );
      return false;
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'BOOKING_STATUS_CHANGED',
        entityType: 'Booking',
        entityId: booking.id,
        performedBy: 'system',
        performedByRole: 'system',
        bookingId: booking.id,
        afterState: {
          status: 'CANCELLED',
          reason: `Lodgify reports this reservation as "${reason}"`,
          lodgifyId: String(lodgifyId),
        } as any,
      },
    });

    this.logger.warn(
      `Cancelled booking ${booking.id} — Lodgify reports "${reason}" (${lodgifyId})`,
    );
    return true;
  }

  async reconcileDeletedFromLodgify(items: any[]): Promise<number> {
    if (process.env.LODGIFY_RECONCILE_DELETIONS === 'false') return 0;

    // An outage, a bad token, or a filtered query all return zero rows — which
    // looks exactly like "every reservation was deleted". Never act on it.
    if (items.length === 0) {
      this.logger.warn('Lodgify returned no bookings — skipping reconciliation');
      return 0;
    }

    // getBookings() asks for size: 100 and does not paginate. A full page means
    // there may be more we never saw, and anything unseen would look deleted.
    if (items.length >= LODGIFY_PAGE_SIZE) {
      this.logger.warn(
        `Lodgify returned a full page (${items.length}) — skipping reconciliation, results may be truncated`,
      );
      return 0;
    }

    const seen = new Set(
      items.map((i) => String(i?.id)).filter((id) => id && id !== 'undefined'),
    );
    if (seen.size === 0) return 0;

    // Only judge bookings inside the window Lodgify actually returned. If the
    // API ever starts filtering to upcoming stays, past bookings would
    // otherwise all look deleted.
    const times = (key: 'arrival' | 'departure') =>
      items
        .map((i) => new Date(i?.[key]).getTime())
        .filter((t) => Number.isFinite(t));
    const arrivals = times('arrival');
    const departures = times('departure');
    if (arrivals.length === 0 || departures.length === 0) return 0;

    const windowStart = new Date(Math.min(...arrivals));
    const windowEnd = new Date(Math.max(...departures));

    // A booking created moments ago (webhook) may post-date the poll's own
    // request, so give it room before treating it as missing.
    const createdBefore = new Date(Date.now() - RECONCILE_GRACE_MS);

    const candidates = await this.prisma.booking.findMany({
      where: {
        status: { notIn: ['CHECKED_OUT', 'CANCELLED'] },
        createdAt: { lt: createdBefore },
        checkIn: { gte: windowStart },
        checkOut: { lte: windowEnd },
      },
      select: { id: true, lodgifyId: true },
    });

    const vanished = candidates.filter(
      (b) => b.lodgifyId && !seen.has(b.lodgifyId),
    );
    if (vanished.length === 0) return 0;

    await this.prisma.booking.updateMany({
      where: { id: { in: vanished.map((b) => b.id) } },
      data: { status: 'CANCELLED' },
    });

    // Recorded per booking — this cancels a stay without a human involved, so
    // it needs to be answerable later.
    await this.prisma.auditLog.createMany({
      data: vanished.map((b) => ({
        action: 'BOOKING_STATUS_CHANGED',
        entityType: 'Booking',
        entityId: b.id,
        performedBy: 'system',
        performedByRole: 'system',
        bookingId: b.id,
        afterState: {
          status: 'CANCELLED',
          reason: 'No longer present in Lodgify',
          lodgifyId: b.lodgifyId,
        } as any,
      })),
    });

    this.logger.warn(
      `Cancelled ${vanished.length} booking(s) no longer in Lodgify: ${vanished
        .map((b) => b.lodgifyId)
        .join(', ')}`,
    );

    return vanished.length;
  }

  async cancelFromLodgify(lodgifyData: any) {
    return this.prisma.booking.update({
      where: { lodgifyId: String(lodgifyData.id) },
      data: { status: 'CANCELLED' },
    });
  }

  async approveManifestAndSendSecondaryLinks(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { manifestGuests: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { manifestStatus: 'APPROVED' },
    });

    // Guests are sent their link when they are ADDED now, so approval is only a
    // backstop for anyone whose send failed at the time. Without this filter
    // every guest would get a second, identical link on approval.
    const needLink = booking.manifestGuests.filter((g) => !g.pwaLinkSent);

    const results = await Promise.allSettled(
      needLink.map((guest) =>
        this.magicLinkService.sendMagicLink({
          email: guest.email,
          firstName: guest.firstName,
          lastName: guest.lastName,
          bookingId,
          role: 'secondary_guest',
          guestTier: 'secondary',
          checkOutDate: booking.checkOut,
        }),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(
      `Manifest approved — ${sent}/${needLink.length} outstanding secondary links sent (${booking.manifestGuests.length} guests total)`,
    );

    return { sent, total: booking.manifestGuests.length };
  }
}
