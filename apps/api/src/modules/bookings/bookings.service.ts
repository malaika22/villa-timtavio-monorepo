import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';
import { BookingStatus } from '@prisma/client';
import { InquiriesService } from '../inqueries/inquiries.service';
import { PusherService } from '../pusher/pusher.service';
import { PaymentsService } from '../payments/payments.service';
import { realFirstName } from '../../commons/utils/name.util';
import { Resend } from 'resend';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

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

  async getCurrentActiveForEm() {
    const include = {
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

    // 1) Currently checked-in. With overlapping test bookings there can be more
    // than one, so prefer the booking the EM actually needs to act on: the one
    // with the most manifest activity, then the most guests, then most recent.
    const checkedIn = await this.prisma.booking.findMany({
      where: { status: 'CHECKED_IN' },
      include,
    });
    if (checkedIn.length > 0) {
      const manifestRank = (s: string) =>
        s === 'SUBMITTED' ? 3 : s === 'APPROVED' ? 2 : s === 'IN_PROGRESS' ? 1 : 0;
      checkedIn.sort((a, b) => {
        const byManifest =
          manifestRank(b.manifestStatus) - manifestRank(a.manifestStatus);
        if (byManifest !== 0) return byManifest;
        const byGuests = b.manifestGuests.length - a.manifestGuests.length;
        if (byGuests !== 0) return byGuests;
        return b.checkIn.getTime() - a.checkIn.getTime();
      });
      return this.withPrimaryLinkSent(checkedIn[0]!);
    }

    // 2) Next upcoming arrival
    const upcoming = await this.prisma.booking.findFirst({
      where: { status: 'CONFIRMED', checkIn: { gte: new Date() } },
      orderBy: { checkIn: 'asc' },
      include,
    });
    if (upcoming) return this.withPrimaryLinkSent(upcoming);

    // 3) Most recent still-active booking as a fallback. Exclude checked-out /
    // cancelled stays — those belong under Past Bookings, not "Current".
    const recent = await this.prisma.booking.findFirst({
      where: { status: { notIn: ['CHECKED_OUT', 'CANCELLED'] } },
      orderBy: { checkIn: 'desc' },
      include,
    });
    return recent ? this.withPrimaryLinkSent(recent) : null;
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

    // Send magic link if check-in within 24 hours
    const hoursUntilCheckIn =
      (booking.checkIn.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilCheckIn <= 24 && hoursUntilCheckIn > 0) {
      await this.magicLinkService.sendMagicLink({
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
        bookingId: booking.id,
        role: 'primary_member',
        guestTier: 'primary',
        checkOutDate: booking.checkOut,
      });
    } else {
      // Booked further out, so the magic link is still weeks or months away —
      // send a branded confirmation now so the guest isn't left with nothing
      // after Lodgify's own guest email was switched off. Best-effort: a failed
      // send must never break the Lodgify sync. This create path is guarded by
      // the lodgifyId lookup above, so it runs once per booking regardless of
      // whether the webhook or the poll fallback got here first.
      await this.sendBookingConfirmationEmail(booking, guest).catch((err) =>
        this.logger.error(`Confirmation email failed: ${String(err)}`),
      );
    }

    return booking;
  }

  /**
   * Branded booking confirmation, sent at booking time for stays that aren't
   * imminent. Mirrors the Villa TimTavio receipt email so the guest's first and
   * last touchpoints look like the same estate. Guarded by RESEND_API_KEY, so
   * this is a no-op in local dev.
   */
  private async sendBookingConfirmationEmail(
    booking: { checkIn: Date; checkOut: Date; nights: number; totalGuests: number },
    guest: { email: string; firstName: string },
  ) {
    if (!this.resend) return;

    const fmtDate = (d: Date) =>
      d.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });

    const detailRow = (label: string, value: string) =>
      `<tr>
         <td style="padding:9px 0;color:#8a8178;font-size:14px;font-family:Helvetica,Arial,sans-serif">${label}</td>
         <td align="right" style="padding:9px 0;color:#2b2824;font-size:14px;font-family:Helvetica,Arial,sans-serif">${value}</td>
       </tr>`;

    await this.resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'reservations@villatimtavio.com',
      to: guest.email,
      subject: 'Your Villa TimTavio reservation is confirmed',
      html: `
      <div style="margin:0;padding:0;background:#f3efe8;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe8;padding:32px 12px;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eae4da;">
              <!-- Brand header -->
              <tr>
                <td style="background:#0f1f2e;padding:28px 36px;text-align:center;">
                  <div style="font-family:Georgia,'Times New Roman',serif;color:#ffffff;font-size:20px;letter-spacing:6px;">VILLA&nbsp;TIMTAVIO</div>
                  <div style="height:2px;width:40px;background:#c8a96e;margin:12px auto 0;"></div>
                  <div style="font-family:Helvetica,Arial,sans-serif;color:#c8a96e;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-top:12px;">Reservation confirmed</div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 36px 8px;">
                  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:26px;color:#1a1614;">Welcome, ${guest.firstName}</h1>
                  <p style="margin:10px 0 0;font-family:Helvetica,Arial,sans-serif;color:#8a8178;font-size:14px;line-height:1.6;">Your reservation at Villa TimTavio is confirmed. We are already preparing the estate for your arrival in Puerto Escondido.</p>
                </td>
              </tr>
              <!-- Stay details -->
              <tr>
                <td style="padding:20px 36px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${detailRow('Arrival', fmtDate(booking.checkIn))}
                    ${detailRow('Departure', fmtDate(booking.checkOut))}
                    ${detailRow('Nights', String(booking.nights))}
                    ${detailRow(
                      'Guests',
                      `${booking.totalGuests} ${booking.totalGuests === 1 ? 'guest' : 'guests'}`,
                    )}
                  </table>
                </td>
              </tr>
              <!-- What happens next -->
              <tr>
                <td style="padding:24px 36px 8px;">
                  <div style="border-top:1px solid #eae4da;padding-top:22px;">
                    <div style="font-family:Helvetica,Arial,sans-serif;color:#c8a96e;font-size:10px;letter-spacing:3px;text-transform:uppercase;">What happens next</div>
                    <p style="margin:12px 0 0;font-family:Helvetica,Arial,sans-serif;color:#8a8178;font-size:14px;line-height:1.7;">
                      Closer to your arrival we will send a private link to your guest portal, where you can introduce your party, choose rooms, share dietary preferences and browse the experiences we curate on the estate.
                    </p>
                    <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;color:#8a8178;font-size:14px;line-height:1.7;">
                      Should anything need attention before then, simply reply to this message — our estate team will take care of it.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:32px 36px 34px;">
                  <div style="border-top:1px solid #eae4da;padding-top:20px;font-family:Helvetica,Arial,sans-serif;color:#b3aaa0;font-size:12px;line-height:1.6;text-align:center;">
                    Villa TimTavio &nbsp;·&nbsp; Puerto Escondido, Oaxaca
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </div>
      `,
    });
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

    const results = await Promise.allSettled(
      booking.manifestGuests.map((guest) =>
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
      `Sent ${sent}/${booking.manifestGuests.length} secondary guest links`,
    );

    return { sent, total: booking.manifestGuests.length };
  }
}
