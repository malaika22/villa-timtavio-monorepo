import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';
import { BookingStatus } from '@prisma/client';
import { InquiriesService } from '../inqueries/inquiries.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private magicLinkService: MagicLinkService,
    private inquiriesService: InquiriesService,
  ) {}

  // ─── Get current booking for guest ───────────────────────────────────────────

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

    return updated;
  }

  // ─── Sync from Lodgify ────────────────────────────────────────────────────────

  async syncFromLodgify(lodgifyData: any) {
    const existing = await this.prisma.booking.findUnique({
      where: { lodgifyId: String(lodgifyData.id) },
    });

    if (existing) {
      return this.updateFromLodgify(lodgifyData);
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

    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          email: guestEmail,
          firstName: lodgifyData.guest?.first_name || 'Guest',
          lastName: lodgifyData.guest?.last_name || '',
          phone: lodgifyData.guest?.phone,
          role: 'PRIMARY',
        },
      });
    }

    const booking = await this.prisma.booking.create({
      data: {
        lodgifyId: String(lodgifyData.id),
        lodgifyRawData: lodgifyData,
        checkIn: new Date(lodgifyData.arrival),
        checkOut: new Date(lodgifyData.departure),
        nights: lodgifyData.nights || 1,
        totalGuests: lodgifyData.people_count || 1,
        baseRate: lodgifyData.total_price || 0,
        status: 'CONFIRMED',
        manifestStatus: 'INCOMPLETE',
        primaryGuestId: guest.id,
      },
    });

    if (guestEmail) {
      await this.inquiriesService.linkToBooking(guestEmail, booking.id);
    }

    this.logger.log(
      `Synced booking ${booking.id} from Lodgify ${lodgifyData.id}`,
    );

    // Add base rate folio item
    await this.prisma.folioItem.create({
      data: {
        bookingId: booking.id,
        type: 'ESTATE_BASE_RATE',
        description: `Casa TimTavio Estate — ${booking.nights} nights`,
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
    }

    return booking;
  }

  async updateFromLodgify(lodgifyData: any) {
    return this.prisma.booking.update({
      where: { lodgifyId: String(lodgifyData.id) },
      data: {
        checkIn: new Date(lodgifyData.arrival),
        checkOut: new Date(lodgifyData.departure),
        nights: lodgifyData.nights,
        lodgifyRawData: lodgifyData,
      },
    });
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
