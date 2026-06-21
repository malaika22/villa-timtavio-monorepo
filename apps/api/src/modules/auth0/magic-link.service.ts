import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import { Auth0ManagementService } from './auth0-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMagicLinkPayload } from './types';
import { AUTH0_NAMESPACE } from '../auth/constants';

@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private auth0Mgmt: Auth0ManagementService,
    private jwtService: JwtService,
    @InjectQueue('magic-links') private magicLinkQueue: Queue,
  ) {}

  // ─── Send Magic Link (called when booking syncs or manifest approved) ─────────

  async sendMagicLink(payload: SendMagicLinkPayload): Promise<void> {
    this.logger.log(
      `Sending magic link to ${payload.email} for booking ${payload.bookingId}`,
    );

    await this.magicLinkQueue.add('send', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }

  // ─── Process Magic Link Job ───────────────────────────────────────────────────

  async processMagicLink(payload: SendMagicLinkPayload): Promise<void> {
    try {
      // Step 1: Find or create Auth0 user (user management only)
      const auth0UserId = await this.auth0Mgmt.findOrCreateUser({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
        bookingId: payload.bookingId,
        guestTier: payload.guestTier,
      });

      // Step 2: Generate OTP + store in DB
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await this.prisma.magicToken.create({
        data: {
          email: payload.email,
          otp,
          bookingId: payload.bookingId,
          guestTier: payload.guestTier,
          expiresAt,
        },
      });

      // Step 3: Send magic link email via Resend
      const magicLinkUrl = `${this.config.get('PWA_URL')}/auth/callback?otp=${otp}&email=${encodeURIComponent(payload.email)}`;

      await this.resend.emails.send({
        from: this.config.get('EMAIL_FROM') || 'reservations@villatimtavio.com',
        to: payload.email,
        subject: 'Your Villa Timtavio access link',
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1A1A18;">
            <p style="font-size:18px;margin-bottom:8px;">Welcome, ${payload.firstName}.</p>
            <p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:32px;">
              Click below to access your stay at Villa Timtavio. This link expires in 10 minutes.
            </p>
            <a href="${magicLinkUrl}"
               style="display:inline-block;padding:14px 32px;background:#1A1A18;color:#fff;text-decoration:none;font-family:sans-serif;font-size:13px;letter-spacing:0.08em;border-radius:6px;">
              ACCESS YOUR STAY
            </a>
            <p style="margin-top:40px;font-size:12px;color:#999;font-family:sans-serif;">
              If you did not request this link, please disregard this email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Magic link sent to ${payload.email}`);

      // Step 4: Update database records
      if (payload.guestTier === 'secondary') {
        await this.prisma.manifestGuest.updateMany({
          where: { bookingId: payload.bookingId, email: payload.email },
          data: {
            pwaLinkSent: true,
            pwaLinkSentAt: new Date(),
            auth0UserId,
          },
        });
      } else {
        const booking = await this.prisma.booking.findUnique({
          where: { id: payload.bookingId },
          include: { primaryGuest: true },
        });
        if (booking?.primaryGuest) {
          await this.prisma.guest.update({
            where: { id: booking.primaryGuest.id },
            data: { auth0Id: auth0UserId },
          });
        }
      }

      // Step 5: Audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'MAGIC_LINK_SENT',
          entityType: 'Guest',
          entityId: auth0UserId,
          performedBy: 'system',
          performedByRole: 'system',
          bookingId: payload.bookingId,
          metadata: { email: payload.email, tier: payload.guestTier } as any,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send magic link to ${payload.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  // ─── Verify OTP + Issue JWT ───────────────────────────────────────────────────

  async verifyOtpAndIssueToken(
    otp: string,
    email: string,
  ): Promise<{ access_token: string; expires_in: number }> {
    const record = await this.prisma.magicToken.findFirst({
      where: { otp, email, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new InternalServerErrorException('Invalid or expired magic link');
    }

    // Mark as used immediately (one-time use)
    await this.prisma.magicToken.update({
      where: { id: record.id },
      data: { used: true },
    });

    const auth0User = await this.auth0Mgmt.getUserByEmail(email);
    const role =
      record.guestTier === 'primary' ? 'primary_member' : 'secondary_guest';

    const expiresIn = 86400; // 24h
    const payload = {
      sub: auth0User?.user_id || email,
      email,
      given_name: auth0User?.given_name || '',
      iss: 'villa-timtavio',
      aud: this.config.get('AUTH0_AUDIENCE'),
      [`${AUTH0_NAMESPACE}/roles`]: [role],
      [`${AUTH0_NAMESPACE}/bookingId`]: record.bookingId,
      [`${AUTH0_NAMESPACE}/guestTier`]: record.guestTier,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn,
      algorithm: 'HS256',
    });

    return { access_token, expires_in: expiresIn };
  }

  // ─── Revoke Access ────────────────────────────────────────────────────────────

  async revokeBookingAccess(bookingId: string): Promise<void> {
    this.logger.log(`Revoking access for booking ${bookingId}`);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: { select: { auth0Id: true } },
        manifestGuests: { select: { auth0UserId: true } },
      },
    });

    if (!booking) return;

    const auth0Ids: string[] = [];
    if (booking.primaryGuest.auth0Id) auth0Ids.push(booking.primaryGuest.auth0Id);
    for (const guest of booking.manifestGuests) {
      if (guest.auth0UserId) auth0Ids.push(guest.auth0UserId);
    }

    await Promise.allSettled(
      auth0Ids.map((id) => this.auth0Mgmt.revokeUserSessions(id)),
    );

    // Invalidate all unused magic tokens for this booking
    await this.prisma.magicToken.updateMany({
      where: { bookingId, used: false },
      data: { used: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'SESSION_REVOKED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: 'system',
        performedByRole: 'system',
        bookingId,
        metadata: { revokedCount: auth0Ids.length } as any,
      },
    });

    this.logger.log(`Revoked ${auth0Ids.length} sessions for booking ${bookingId}`);
  }

  // ─── Resend Magic Link ────────────────────────────────────────────────────────

  async resendToManifestGuest(manifestGuestId: string): Promise<void> {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: manifestGuestId },
      include: { booking: true },
    });

    if (!guest) throw new InternalServerErrorException('Guest not found');

    await this.sendMagicLink({
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName,
      bookingId: guest.bookingId,
      role: 'secondary_guest',
      guestTier: 'secondary',
      checkOutDate: guest.booking.checkOut,
    });

    await this.prisma.manifestGuest.update({
      where: { id: manifestGuestId },
      data: { pwaLinkSent: true, pwaLinkSentAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MAGIC_LINK_RESENT',
        entityType: 'ManifestGuest',
        entityId: manifestGuestId,
        performedBy: 'estate_manager',
        performedByRole: 'estate_manager',
        bookingId: guest.bookingId,
        metadata: { email: guest.email } as any,
      },
    });
  }
}
