import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { MagicLinkService } from './magic-link.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { recipientLabel } from '../../commons/utils/name.util';

@Controller('api/v1/magic-link')
export class MagicLinkController {
  constructor(
    private magicLinkService: MagicLinkService,
    private prisma: PrismaService,
  ) {}

  // ─── Manually send magic link to primary member ───────────────────────────
  // Rodrigo triggers this from the booking detail page

  @Post('send/:bookingId')
  @Roles('estate_manager')
  async sendToBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot send link for a cancelled booking');
    }

    if (booking.status === 'CHECKED_OUT') {
      throw new BadRequestException('Cannot send link after checkout');
    }

    await this.magicLinkService.sendMagicLink({
      email: booking.primaryGuest.email,
      firstName: booking.primaryGuest.firstName,
      lastName: booking.primaryGuest.lastName,
      bookingId: booking.id,
      role: 'primary_member',
      guestTier: 'primary',
      checkOutDate: booking.checkOut,
    });

    // Log who triggered the manual send
    await this.prisma.auditLog.create({
      data: {
        action: 'MAGIC_LINK_SENT',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: user.auth0Id,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: {
          triggeredManually: true,
          recipientEmail: booking.primaryGuest.email,
          triggeredBy: user.auth0Id,
        } as any,
      },
    });

    return {
      success: true,
      sentTo: booking.primaryGuest.email,
      message: `Magic link sent to ${recipientLabel(
        booking.primaryGuest.firstName,
        booking.primaryGuest.lastName,
        booking.primaryGuest.email,
      )}`,
    };
  }

  // ─── Verify OTP + issue JWT (called by PWA callback page) ───────────────

  @Post('verify')
  @Public()
  async verifyOtp(@Body() body: { otp: string; email: string }) {
    if (!body.otp || !body.email) {
      throw new BadRequestException('otp and email are required');
    }
    return this.magicLinkService.verifyOtpAndIssueToken(body.otp, body.email);
  }

  // ─── Resend magic link to a specific secondary guest ─────────────────────
  // Rodrigo triggers this from the manifest table

  @Post('resend/:manifestGuestId')
  @Roles('estate_manager')
  async resendToManifestGuest(
    @Param('manifestGuestId') manifestGuestId: string,
    @CurrentUser() user: any,
  ) {
    return this.magicLinkService.resendToManifestGuest(manifestGuestId);
  }

  // ─── Send magic links to ALL secondary guests for a booking ──────────────
  // Rodrigo triggers this if he needs to resend all links at once

  @Post('send-all-secondary/:bookingId')
  @Roles('estate_manager')
  async sendAllSecondary(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        manifestGuests: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.manifestStatus !== 'APPROVED') {
      throw new BadRequestException(
        'Manifest must be approved before sending secondary guest links',
      );
    }

    if (booking.manifestGuests.length === 0) {
      throw new BadRequestException('No secondary guests in manifest');
    }

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
    const failed = results.filter((r) => r.status === 'rejected').length;

    await this.prisma.auditLog.create({
      data: {
        action: 'MAGIC_LINK_SENT',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: user.auth0Id,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: {
          action: 'resent_all_secondary',
          sent,
          failed,
          totalGuests: booking.manifestGuests.length,
        } as any,
      },
    });

    return {
      success: true,
      sent,
      failed,
      total: booking.manifestGuests.length,
      message: `Sent ${sent} of ${booking.manifestGuests.length} secondary guest links`,
    };
  }
}
