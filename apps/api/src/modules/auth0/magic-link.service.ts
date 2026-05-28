import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Auth0ManagementService } from './auth0-management.service';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendMagicLinkPayload {
  email: string;
  firstName: string;
  lastName: string;
  bookingId: string;
  role: 'primary_member' | 'secondary_guest';
  guestTier: 'primary' | 'secondary';
  // How many hours before checkout the link expires
  // Primary member: link sent 24h before check-in, expires 24h after checkout
  // Secondary guest: link expires 24h after checkout
  checkOutDate: Date;
}

@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private auth0Mgmt: Auth0ManagementService,
    @InjectQueue('magic-links') private magicLinkQueue: Queue,
  ) {}

  // ─── Send Magic Link (called when booking syncs or manifest approved) ─────────

  async sendMagicLink(payload: SendMagicLinkPayload): Promise<void> {
    this.logger.log(
      `Sending magic link to ${payload.email} for booking ${payload.bookingId}`,
    );

    // Add to queue — do not block the calling request
    await this.magicLinkQueue.add('send', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
  }

  // ─── Process Magic Link Job (runs in background) ──────────────────────────────

  async processMagicLink(payload: SendMagicLinkPayload): Promise<void> {
    try {
      // Step 1: Find or create Auth0 user
      const auth0UserId = await this.auth0Mgmt.findOrCreateUser({
        email: payload.email,
        role: payload.role,
        bookingId: payload.bookingId,
        guestTier: payload.guestTier,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });

      // Step 2: Send passwordless email via Auth0
      await axios.post(
        `https://${this.config.get('AUTH0_DOMAIN')}/passwordless/start`,
        {
          client_id: this.config.get('AUTH0_PWA_CLIENT_ID'),
          client_secret: this.config.get('AUTH0_DASHBOARD_CLIENT_SECRET'),
          connection: 'email',
          email: payload.email,
          send: 'link',
          authParams: {
            redirect_uri: `${this.config.get('PWA_URL')}/auth/callback`,
            scope: 'openid profile email',
            audience: this.config.get('AUTH0_AUDIENCE'),
            response_type: 'code',
            // Pass booking context through state parameter
            state: Buffer.from(
              JSON.stringify({
                bookingId: payload.bookingId,
                tier: payload.guestTier,
              }),
            ).toString('base64'),
          },
        },
      );

      // Step 3: Update manifest guest record with Auth0 user ID
      if (payload.guestTier === 'secondary') {
        await this.prisma.manifestGuest.updateMany({
          where: {
            bookingId: payload.bookingId,
            email: payload.email,
          },
          data: {
            pwaLinkSent: true,
            auth0UserId,
          },
        });
      }

      this.logger.log(`Magic link sent successfully to ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send magic link to ${payload.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  // ─── Revoke Access (called at checkout + 24h) ────────────────────────────────

  async revokeAccess(bookingId: string): Promise<void> {
    this.logger.log(`Revoking PWA access for booking ${bookingId}`);

    // Get all guests for this booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: true,
        manifestGuests: true,
      },
    });

    if (!booking) return;

    const allAuth0Ids: string[] = [];

    // Primary guest
    if (booking.primaryGuest.auth0Id) {
      allAuth0Ids.push(booking.primaryGuest.auth0Id);
    }

    // Secondary guests
    for (const guest of booking.manifestGuests) {
      if (guest.auth0UserId) {
        allAuth0Ids.push(guest.auth0UserId);
      }
    }

    // Revoke sessions for all guests
    await Promise.allSettled(
      allAuth0Ids.map((id) => this.auth0Mgmt.revokeUserSessions(id)),
    );

    this.logger.log(
      `Revoked access for ${allAuth0Ids.length} guests on booking ${bookingId}`,
    );
  }

  // ─── Resend Magic Link (EM action from dashboard) ────────────────────────────

  async resendMagicLink(manifestGuestId: string): Promise<void> {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: manifestGuestId },
      include: { booking: true },
    });

    if (!guest) throw new Error('Guest not found');

    await this.sendMagicLink({
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName,
      bookingId: guest.bookingId,
      role: 'secondary_guest',
      guestTier: 'secondary',
      checkOutDate: guest.booking.checkOut,
    });
  }
}
