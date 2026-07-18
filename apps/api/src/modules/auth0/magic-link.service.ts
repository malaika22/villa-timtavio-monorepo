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
      const logoUrl =
        this.config.get('EMAIL_LOGO_URL') ||
        'https://www.villatimtavio.com/images/logo-dark.png';

      await this.resend.emails.send({
        from: this.config.get('EMAIL_FROM') || 'reservations@villatimtavio.com',
        to: payload.email,
        subject: 'Your Villa TimTavio access link',
        html: `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background-color:#f5f3f0;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:560px;background-color:#ffffff;border:1px solid #e8e6e0;border-radius:10px;">
                  <tr>
                    <td align="center" style="padding:44px 44px 0 44px;">
                      <img src="${logoUrl}" alt="Villa TimTavio" width="140"
                           style="display:block;width:140px;max-width:55%;height:auto;margin:0 auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:18px 44px 0 44px;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;
                                letter-spacing:0.22em;text-transform:uppercase;color:#8c7261;">
                        Villa TimTavio
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:22px 44px 0 44px;">
                      <div style="width:40px;height:2px;background-color:#c4a882;margin:0 auto;line-height:2px;font-size:0;">&nbsp;</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:28px 44px 0 44px;font-family:Georgia,'Times New Roman',serif;">
                      <p style="margin:0 0 14px 0;font-size:20px;color:#0f1f2e;">
                        Welcome, ${payload.firstName}.
                      </p>
                      <p style="margin:0;font-size:15px;line-height:1.8;color:#5f5e5a;">
                        Click below to access your stay at Villa TimTavio.
                        This link expires in 10 minutes.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:32px 44px 4px 44px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td align="center" style="background-color:#0f1f2e;border-radius:8px;">
                            <a href="${magicLinkUrl}"
                               style="display:inline-block;padding:15px 40px;color:#ffffff;text-decoration:none;
                                      font-family:Arial,sans-serif;font-size:12px;font-weight:600;
                                      letter-spacing:0.14em;text-transform:uppercase;">
                              Access Your Stay
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:24px 44px 0 44px;">
                      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#b0a898;line-height:1.6;">
                        If you did not request this link, please disregard this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px 44px 40px 44px;">
                      <div style="border-top:1px solid #e8e6e0;padding-top:22px;text-align:center;">
                        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;
                                  font-size:13px;color:#b4b2a9;">
                          Villa TimTavio &middot; Puerto Escondido, Oaxaca
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
