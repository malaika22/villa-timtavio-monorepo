import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtService } from '@nestjs/jwt';
import { realFirstName } from '../../commons/utils/name.util';
import { Resend } from 'resend';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { Auth0ManagementService } from './auth0-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMagicLinkPayload } from './types';
import { AUTH0_NAMESPACE } from '../auth/constants';
import { greeting } from '../../commons/utils/name.util';

@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  /**
   * Wrong guesses allowed against one address before it goes quiet.
   *
   * Ten in five minutes is far more than a guest re-typing a code out of an
   * email will ever need, and short enough that being wrong about that costs
   * them five minutes rather than a quarter of an hour. Someone working
   * through nine hundred thousand codes at that rate still needs about eight
   * months of uninterrupted grinding, against a code that dies with the
   * booking.
   */
  private static readonly MAX_FAILURES = 10;
  private static readonly FAILURE_WINDOW_SECONDS = 5 * 60;

  /**
   * Shared across instances, unlike the per-process counter behind the route's
   * IP limit — the API runs on more than one server, so anything held in
   * memory is really N separate limits and which one you meet is luck.
   *
   * Redis is already here for the job queues. Lazily connected so the process
   * doesn't fail to boot over a limiter.
   */
  private failureStore: Redis | null = null;

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
      //
      // The code lasts the stay, not half an hour.
      //
      // Thirty minutes made sense for a code typed straight off the screen.
      // It is wrong for a link that lives in an inbox: guests close the tab,
      // come back that evening, and tap the same email rather than typing the
      // address — and were told their code didn't match, on an app they were
      // in fact still signed into.
      //
      // Bounded by the moment access is revoked anyway. jwt.strategy refuses a
      // guest token 24 hours after checkout, so a code alive past that could
      // only mint one that is rejected on its first request. Nothing is gained
      // by outliving it, and an unbounded six-digit code is a very different
      // proposition — see the throttle on the verify route.
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = await this.magicTokenExpiry(payload.bookingId);

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
        subject: 'Your stay at Villa TimTavio awaits',
        html: `
          <style>
            @media only screen and (max-width:600px) {
              .tt-pad { padding-left:22px !important; padding-right:22px !important; }
              .tt-h1 { font-size:19px !important; }
              .tt-body { font-size:14px !important; line-height:1.6 !important; }
              .tt-btn a { padding:14px 30px !important; }
            }
          </style>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background-color:#f5f3f0;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:560px;background-color:#ffffff;border:1px solid #e8e6e0;border-radius:10px;">
                  <tr>
                    <td align="center" class="tt-pad" style="padding:36px 32px 0 32px;">
                      <img src="${logoUrl}" alt="Villa TimTavio" width="132"
                           style="display:block;width:132px;max-width:60%;height:auto;margin:0 auto;" />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" class="tt-pad" style="padding:16px 32px 0 32px;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;
                                letter-spacing:0.2em;text-transform:uppercase;color:#8c7261;">
                        Villa TimTavio
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:18px 32px 0 32px;">
                      <div style="width:40px;height:2px;background-color:#c4a882;margin:0 auto;line-height:2px;font-size:0;">&nbsp;</div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" class="tt-pad" style="padding:24px 32px 0 32px;font-family:Georgia,'Times New Roman',serif;">
                      <p class="tt-h1" style="margin:0 0 12px 0;font-size:20px;color:#0f1f2e;">
                        ${greeting(payload.firstName)}
                      </p>
                      <p class="tt-body" style="margin:0;font-size:15px;line-height:1.7;color:#5f5e5a;">
                        The doors to your private villa above the Pacific are open.
                        Step inside to arrange your rooms, curate bespoke experiences,
                        and shape every detail of your stay before you arrive.
                      </p>
                      <p class="tt-body" style="margin:14px 0 0 0;font-size:13px;line-height:1.7;color:#8c7261;">
                        Your private link opens the moment you tap below, and
                        stays yours for the length of your visit — come back to
                        this message whenever you like.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:28px 24px 4px 24px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" class="tt-btn" style="margin:0 auto;">
                        <tr>
                          <td align="center" style="background-color:#0f1f2e;border-radius:8px;">
                            <a href="${magicLinkUrl}"
                               style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;
                                      font-family:Arial,sans-serif;font-size:12px;font-weight:600;
                                      letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;">
                              Access Your Stay
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" class="tt-pad" style="padding:26px 32px 0 32px;">
                      <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:11px;
                                letter-spacing:0.14em;text-transform:uppercase;color:#b0a898;">
                        Or enter this code
                      </p>
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;
                                letter-spacing:0.32em;color:#0f1f2e;text-indent:0.32em;">
                        ${otp}
                      </p>
                      <p style="margin:10px 0 0 0;font-family:Arial,sans-serif;font-size:12px;
                                color:#8c7261;line-height:1.6;">
                        Use this if you have added Villa TimTavio to your home screen —
                        tapping the button above opens your browser instead.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" class="tt-pad" style="padding:22px 32px 0 32px;">
                      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#b0a898;line-height:1.6;">
                        If you did not request this link, please disregard this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="tt-pad" style="padding:28px 32px 36px 32px;">
                      <div style="border-top:1px solid #e8e6e0;padding-top:20px;text-align:center;">
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

  /**
   * How many wrong guesses this address has made lately, and the machinery to
   * count them.
   *
   * Every one of these fails open. A limiter that cannot reach its store must
   * let the guest in, not lock them out — the whole point of the change that
   * made this necessary was that guests were being turned away by something
   * that had nothing to do with them.
   */
  private redis(): Redis | null {
    if (this.failureStore) return this.failureStore;
    try {
      this.failureStore = new Redis({
        host: this.config.get('REDIS_HOST') || 'localhost',
        port: Number(this.config.get('REDIS_PORT')) || 6379,
        password: this.config.get('REDIS_PASSWORD') || undefined,
        lazyConnect: false,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      // Without a handler an ECONNREFUSED from ioredis is an unhandled error
      // event, which takes the process down — over a rate limiter.
      this.failureStore.on('error', (err) =>
        this.logger.warn(`OTP attempt store unavailable: ${err.message}`),
      );
    } catch (err) {
      this.logger.warn(`OTP attempt store unavailable: ${String(err)}`);
      this.failureStore = null;
    }
    return this.failureStore;
  }

  private failureKey(email: string): string {
    return `magic-otp-fail:${email.trim().toLowerCase()}`;
  }

  /**
   * Null when they're fine, otherwise the minutes left to wait.
   *
   * The real remaining time, not the width of the window: a guest who used up
   * their attempts four minutes ago should be told one minute, not five.
   * Falls back to the full window if the store won't say, and never rounds
   * down to zero — "try again in 0 minutes" is not an instruction.
   */
  private async lockoutMinutes(email: string): Promise<number | null> {
    const store = this.redis();
    if (!store) return null;
    try {
      const key = this.failureKey(email);
      const count = Number(await store.get(key)) || 0;
      if (count < MagicLinkService.MAX_FAILURES) return null;

      const ttl = await store.ttl(key);
      const seconds = ttl > 0 ? ttl : MagicLinkService.FAILURE_WINDOW_SECONDS;
      return Math.max(1, Math.ceil(seconds / 60));
    } catch {
      return null;
    }
  }

  /** Only failures are counted, so a guest signing in never spends budget. */
  private async recordFailure(email: string): Promise<void> {
    const store = this.redis();
    if (!store) return;
    try {
      const key = this.failureKey(email);
      const count = await store.incr(key);
      // Set on the first failure only, so the window runs from that one and a
      // steady trickle of guesses can't hold it open indefinitely.
      if (count === 1) {
        await store.expire(key, MagicLinkService.FAILURE_WINDOW_SECONDS);
      }
    } catch {
      /* counting is best-effort; never block on it */
    }
  }

  /** A correct code wipes the slate — fumbling then succeeding is not suspicious. */
  private async clearFailures(email: string): Promise<void> {
    const store = this.redis();
    if (!store) return;
    try {
      await store.del(this.failureKey(email));
    } catch {
      /* nothing to do */
    }
  }

  /**
   * When a code stops working: the same moment the session it mints would be.
   *
   * MAGIC_LINK_TTL_MINUTES still applies as a floor, so the old lever is not
   * silently dead — but it can only extend a very short stay, never shorten a
   * long one, because shortening is the behaviour that caused the complaint.
   *
   * A booking that has gone missing falls back to the floor rather than to
   * forever. Not knowing when a stay ends is not a reason to issue a code that
   * never stops working.
   */
  private async magicTokenExpiry(bookingId: string): Promise<Date> {
    const floorMinutes =
      Number(this.config.get('MAGIC_LINK_TTL_MINUTES')) || 30;
    const floor = new Date(Date.now() + floorMinutes * 60 * 1000);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { checkOut: true },
    });
    if (!booking) return floor;

    const revoked = new Date(booking.checkOut.getTime() + 24 * 60 * 60 * 1000);
    return revoked > floor ? revoked : floor;
  }

  // ─── Verify OTP + Issue JWT ───────────────────────────────────────────────────

  async verifyOtpAndIssueToken(
    otp: string,
    email: string,
  ): Promise<{ access_token: string; expires_in: number }> {
    // Looked up without the expiry, then judged — the two used to be one
    // query, so a stale code and a mistyped one were indistinguishable and
    // both were reported as "that code didn't match". A guest re-reading six
    // digits that were correct all along is being sent to look for a mistake
    // that isn't there.
    //
    // Still not one-time. Link-scanners and callback re-renders touch the URL
    // before the guest does, and rejecting a code because something else
    // already used it locks out the person it belongs to.
    /**
     * Wrong guesses, counted against the address rather than the caller.
     *
     * The route also has an IP limit, and an IP limit is the wrong shape for
     * this: anyone rotating addresses walks past it, and a family sharing one
     * hotel connection all count as the same person. What actually needs
     * protecting is a particular guest's code.
     *
     * Checked before the lookup so a locked-out address costs no database
     * work, and expressed as a wait rather than a refusal — the guest reading
     * it is far likelier to be someone fumbling a code than someone attacking
     * one.
     */
    const waitMinutes = await this.lockoutMinutes(email);
    if (waitMinutes !== null) {
      // Says wait, and not "send yourself a new link".
      //
      // A new link would not help: the check sits before the lookup, so a
      // freshly issued code is refused too. That is deliberate — evaluating
      // codes while locked out is exactly what reopens the guessing — but it
      // makes "send yourself a new link" advice that cannot work, and sending
      // a guest to do something futile is worse than telling them to wait.
      //
      // The call button underneath is the way through in the meantime, and it
      // now dials a real number.
      throw new HttpException(
        `Too many attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} — a new link won’t open sooner.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const record = await this.prisma.magicToken.findFirst({
      where: { otp, email },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      await this.recordFailure(email);
      throw new UnauthorizedException(
        'That code didn’t match. Check the six digits, or send yourself a new link.',
      );
    }

    if (record.expiresAt <= new Date()) {
      // A different fact, and worth its own sentence: nothing is wrong with
      // what they typed, it has simply run out.
      //
      // Deliberately not counted as a failed attempt. A real code that has
      // aged out is a guest holding an old email, and locking them out for
      // being early to it would be the wrong way round.
      throw new UnauthorizedException(
        'That link has expired. Send yourself a new one to get back in.',
      );
    }

    const auth0User = await this.auth0Mgmt.getUserByEmail(email);
    const role =
      record.guestTier === 'primary' ? 'primary_member' : 'secondary_guest';

    // The session lasts the life of the booking, not a flat day. A guest who
    // signs in during August to plan a September stay must still be signed in
    // when they arrive — otherwise the pre-arrival planning flow only works for
    // people who never close the tab.
    //
    // Bounded by the same moment access is revoked anyway (24h after checkout),
    // so a stale token can't outlive the stay it belongs to. Falls back to a day
    // if the booking has somehow gone.
    const ONE_DAY = 86400;
    const booking = await this.prisma.booking.findUnique({
      where: { id: record.bookingId },
      select: {
        checkOut: true,
        primaryGuest: { select: { firstName: true } },
      },
    });
    const secondsUntilRevocation = booking
      ? Math.floor((booking.checkOut.getTime() - Date.now()) / 1000) + ONE_DAY
      : ONE_DAY;
    const expiresIn = Math.max(ONE_DAY, secondsUntilRevocation);

    // The name the PWA greets them by, taken from our own records first.
    //
    // It used to come only from the Auth0 profile — and getUserByEmail
    // swallows every error and returns null, so an Auth0 blip, a rate limit
    // or a profile saved without a name all produced a token with an empty
    // given_name and a home screen that couldn't say whose stay it was. We
    // have the name locally the whole time: the reservation for a primary,
    // the manifest row for anyone else.
    const localFirstName =
      record.guestTier === 'primary'
        ? realFirstName(booking?.primaryGuest?.firstName)
        : realFirstName(
            (
              await this.prisma.manifestGuest.findFirst({
                where: { bookingId: record.bookingId, email },
                select: { firstName: true },
              })
            )?.firstName,
          );

    const payload = {
      sub: auth0User?.user_id || email,
      email,
      given_name:
        localFirstName ?? realFirstName(auth0User?.given_name) ?? '',
      iss: 'villa-timtavio',
      aud: this.config.get('AUTH0_AUDIENCE'),
      [`${AUTH0_NAMESPACE}/roles`]: [role],
      [`${AUTH0_NAMESPACE}/bookingId`]: record.bookingId,
      [`${AUTH0_NAMESPACE}/guestTier`]: record.guestTier,
    };

    // Right code: forget the fumbles. Only wrong guesses accumulate, so a
    // guest who mistypes twice and then gets it right starts clean, and
    // signing in can never spend the budget that locks them out.
    await this.clearFailures(email);

    // Sign first — if this throws (e.g. misconfigured JWT_SECRET) the token is
    // NOT consumed, so the guest can retry the same link once the issue is fixed.
    const access_token = this.jwtService.sign(payload, {
      expiresIn,
      algorithm: 'HS256',
    });

    // Consume the one-time token only after the access token is successfully issued.
    await this.prisma.magicToken.update({
      where: { id: record.id },
      data: { used: true },
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
    if (booking.primaryGuest.auth0Id)
      auth0Ids.push(booking.primaryGuest.auth0Id);
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

    this.logger.log(
      `Revoked ${auth0Ids.length} sessions for booking ${bookingId}`,
    );
  }

  // ─── Resend Magic Link ────────────────────────────────────────────────────────

  /**
   * Guest self-service recovery: given an email, find a live booking it belongs
   * to (as the primary member or a manifest guest) and send a fresh magic link.
   * Always resolves without revealing whether the email matched a reservation
   * (anti-enumeration) — the controller returns a neutral message either way.
   */
  async requestByEmail(rawEmail: string): Promise<void> {
    const email = rawEmail?.trim();
    if (!email) return;
    const notEnded: any = { notIn: ['CANCELLED', 'CHECKED_OUT'] };

    const primaryBooking = await this.prisma.booking.findFirst({
      where: {
        status: notEnded,
        primaryGuest: { is: { email: { equals: email, mode: 'insensitive' } } },
      },
      include: { primaryGuest: true },
      orderBy: { checkOut: 'desc' },
    });
    if (primaryBooking) {
      await this.sendMagicLink({
        email: primaryBooking.primaryGuest.email,
        firstName: primaryBooking.primaryGuest.firstName,
        lastName: primaryBooking.primaryGuest.lastName,
        bookingId: primaryBooking.id,
        role: 'primary_member',
        guestTier: 'primary',
        checkOutDate: primaryBooking.checkOut,
      });
      return;
    }

    const guest = await this.prisma.manifestGuest.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        booking: { status: notEnded },
      },
      include: { booking: true },
      orderBy: { createdAt: 'desc' },
    });
    if (guest) {
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
        where: { id: guest.id },
        data: { pwaLinkSent: true, pwaLinkSentAt: new Date() },
      });
    }
  }

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
