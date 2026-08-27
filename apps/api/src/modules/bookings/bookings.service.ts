import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MagicLinkService } from '../auth0/magic-link.service';
import { BookingStatus } from '@prisma/client';
import { InquiriesService } from '../inqueries/inquiries.service';
import { PusherService } from '../pusher/pusher.service';
import { PaymentsService } from '../payments/payments.service';
import { realFirstName } from '../../commons/utils/name.util';

/** Matches the `size` LodgifyService requests; a full page means truncation. */
/**
 * What Lodgify says about one reservation when asked about it directly.
 *
 * Structurally identical to LodgifyService's own type and declared here on
 * purpose: this service takes the answer as a plain function argument, so it
 * does not depend on the Lodgify module to describe one.
 */
export type ReservationPresence =
  | { state: 'present' }
  | { state: 'gone' }
  | { state: 'not-a-stay'; reason: string }
  | { state: 'unknown' };

const LODGIFY_PAGE_SIZE = 100;
/** How settled a booking must be before absence counts as deletion. */
const RECONCILE_GRACE_MS = 10 * 60 * 1000;

/**
 * The address a reservation gets when Lodgify has none for it.
 *
 * Domain-scoped so it can never collide with a real one, and carrying the
 * reservation id so a row in the guest table can be traced back to the
 * booking that produced it. Nothing is ever sent here — see AWAITING_NAME.
 */
const PLACEHOLDER_DOMAIN = 'unassigned.villatimtavio.com';
const placeholderEmail = (lodgifyId: unknown) =>
  `lodgify-${String(lodgifyId)}@${PLACEHOLDER_DOMAIN}`;
const isPlaceholderEmail = (email: string) =>
  email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);

/** Reads as a state rather than a person, because that is what it is. */
const AWAITING_NAME = { firstName: 'Awaiting guest', lastName: 'details' };

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
        await this.reconcileGuestFromLodgify(existing.id, lodgifyData);
        await this.inquiriesService.linkToBooking(guestEmail, existing.id);
      }
      return updated;
    }

    /**
     * A reservation with nobody on it still occupies the villa.
     *
     * This used to return, so a booking created by hand in Lodgify with the
     * guest left blank simply never existed here — absent from Bookings, from
     * Guests, from the folio — and the only trace was a line in the Render
     * log. The estate would find out when somebody arrived.
     *
     * Guest.email is unique and required and a booking must have a primary,
     * so it is given a placeholder tied to the reservation id: unique,
     * traceable, and impossible to mistake for a person. The stay shows up
     * with its real dates and party size, and an alert says what is missing.
     *
     * When the address is filled in, the placeholder holds exactly one booking
     * and the new address belongs to nobody — the rename case above — so it
     * quietly becomes the real guest. The booking never moves.
     */
    const realEmail = lodgifyData.guest?.email;
    const guestEmail = realEmail || placeholderEmail(lodgifyData.id);
    const awaitingDetails = !realEmail;

    if (awaitingDetails) {
      this.logger.warn(
        `Lodgify booking ${lodgifyData.id} has no guest email — holding it against a placeholder`,
      );
    }

    const guest = await this.findOrCreateGuest(guestEmail, lodgifyData);

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
    // Not for a reservation with nobody on it: there is no customer to hold
    // against, and the failure would look like a payment problem rather than a
    // missing address.
    if (!awaitingDetails) {
      await this.paymentsService
        .createDepositHold(booking.id)
        .catch((err) =>
          this.logger.error(`Deposit hold failed: ${String(err)}`),
        );
    }

    this.logger.log(
      `Synced booking ${booking.id} from Lodgify ${lodgifyData.id}`,
    );

    // A log line is not telling anybody. SystemAlert already reaches the
    // dashboard, the notifications page and the bell.
    if (awaitingDetails) {
      await this.prisma.systemAlert
        .create({
          data: {
            severity: 'WARNING',
            title: 'Reservation has no guest email',
            message:
              `${booking.checkIn.toISOString().slice(0, 10)} → ${booking.checkOut
                .toISOString()
                .slice(0, 10)} · ${booking.totalGuests} guests. ` +
              'Add an email on the reservation in Lodgify — until then the guest cannot be sent the app.',
            category: 'BOOKING',
            entityType: 'Booking',
            entityId: booking.id,
          },
        })
        .catch((err) =>
          this.logger.error(`Alert failed for ${booking.id}: ${String(err)}`),
        );
    }

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

    // Never to a placeholder. The address is ours, not a guest's, and mail to
    // it would bounce off a domain that does not accept any.
    if (stayIsImminentOrActive && !awaitingDetails) {
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

  /**
   * The guest behind an address, made if they are new.
   *
   * Extracted so the creation path and the re-link cannot disagree about what
   * "the guest on this reservation" means — the re-link exists precisely
   * because those two answers had drifted apart.
   *
   * The name is seeded or backfilled here too. Lodgify often sends none and
   * defaults to the "Guest" placeholder, in which case a linked inquiry is
   * asked instead; a guest who already has a real name keeps it.
   */
  private async findOrCreateGuest(email: string, lodgifyData: any) {
    const existing = await this.prisma.guest.findUnique({ where: { email } });

    // A real name from Lodgify, or nothing. Lodgify sends "Guest" as a
    // placeholder on a reservation nobody has filled in, and treating that as
    // an answer is how a guest with a proper name loses it.
    const sentFirst = realFirstName(lodgifyData.guest?.first_name);
    const sentLast = lodgifyData.guest?.last_name || undefined;
    const sentPhone = lodgifyData.guest?.phone || undefined;

    if (!existing) {
      if (isPlaceholderEmail(email)) {
        return this.prisma.guest.create({
          data: { email, ...AWAITING_NAME, role: 'PRIMARY' },
        });
      }
      const inquiry = await this.inquiriesService.findLatestByEmail(email);
      return this.prisma.guest.create({
        data: {
          email,
          firstName: sentFirst ?? inquiry?.firstName ?? 'Guest',
          lastName: sentLast ?? inquiry?.lastName ?? '',
          phone: sentPhone,
          role: 'PRIMARY',
        },
      });
    }

    /**
     * Follow the reservation, not just fill a gap.
     *
     * This used to return the moment an existing guest had a real name, which
     * meant a correction made in Lodgify — a misspelling, a married name, a
     * new number — never arrived. Only an empty record was ever updated.
     *
     * Lodgify wins where Lodgify has something to say. That is the same rule
     * the email now follows, and Lodgify is where the estate actually edits;
     * the cost is that a name corrected in our own dashboard is overwritten
     * on the next poll.
     */
    const patch: { firstName?: string; lastName?: string; phone?: string } = {};

    if (sentFirst && sentFirst !== existing.firstName) {
      patch.firstName = sentFirst;
    }
    if (sentLast && sentLast !== existing.lastName) {
      patch.lastName = sentLast;
    }
    if (sentPhone && sentPhone !== existing.phone) {
      patch.phone = sentPhone;
    }

    // Still nameless and Lodgify has none either — ask the inquiry that
    // brought them, which is the only other place a real name lives.
    if (!sentFirst && !realFirstName(existing.firstName)) {
      const inquiry = await this.inquiriesService.findLatestByEmail(email);
      const fromInquiry = realFirstName(inquiry?.firstName ?? undefined);
      if (fromInquiry) {
        patch.firstName = fromInquiry;
        patch.lastName = inquiry?.lastName || existing.lastName;
      }
    }

    if (Object.keys(patch).length === 0) return existing;

    this.logger.log(
      `Guest ${existing.id} updated from Lodgify: ${Object.keys(patch).join(', ')}`,
    );
    return this.prisma.guest.update({
      where: { id: existing.id },
      data: patch,
    });
  }

  /**
   * Brings a booking's guest into line with the reservation.
   *
   * Two jobs: keep their name and number current, and move the booking
   * altogether when Lodgify names somebody else.
   *
   * primaryGuestId was written once, at creation, and never revisited — so a
   * reservation whose guest details were filled in afterwards stayed filed
   * under whoever it first matched. That is what happened to Brandon Keith:
   * created by hand in Lodgify on 23 August with no guest of its own, matched
   * to the account holder, and then given its real guest a day later. Every
   * poll since re-read the payload, stored Brandon's address in
   * lodgifyRawData, and left the booking on Tim Haughinberry's record.
   *
   * The cost of that is two-sided and neither half is visible: the guest it
   * belongs to never appears in Guests at all, and the guest it landed on
   * grows a stay they never made — with its nights, its party size and its
   * folio total reading as theirs.
   *
   * Only ever follows Lodgify. A booking is theirs to describe, and the email
   * on it is the closest thing to an identity a reservation has.
   */
  private async reconcileGuestFromLodgify(
    bookingId: string,
    lodgifyData: any,
  ): Promise<void> {
    const email = String(lodgifyData.guest?.email ?? '').trim();
    if (!email) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        primaryGuestId: true,
        primaryGuest: { select: { email: true } },
      },
    });
    if (!booking) return;

    const sameAddress =
      booking.primaryGuest.email.trim().toLowerCase() === email.toLowerCase();

    /**
     * A corrected spelling, or a different person?
     *
     * Moving the booking is right for a different person and quietly
     * destructive for a typo: the new record starts blank, and the allergies,
     * beverage notes, staff notes and lifetime spend stay behind on a guest
     * with no stays, invisible and unreachable. The estate would enter them
     * all again.
     *
     * Two questions separate the cases, and each is evidence of a second
     * person existing. Somebody already holding the new address is a real
     * guest with a record of their own. A current guest with other bookings is
     * a real guest too — they simply are not the one on this reservation, and
     * their email is not ours to rewrite.
     *
     * Neither true means nobody else is involved at all: one booking, one
     * guest, one corrected address. Renaming keeps everything attached and
     * leaves no orphan.
     */
    if (!sameAddress) {
      const [alreadySomeone, otherStays] = await Promise.all([
        this.prisma.guest.findUnique({
          where: { email },
          select: { id: true },
        }),
        this.prisma.booking.count({
          where: {
            primaryGuestId: booking.primaryGuestId,
            id: { not: bookingId },
          },
        }),
      ]);

      if (!alreadySomeone && otherStays === 0) {
        try {
          await this.prisma.guest.update({
            where: { id: booking.primaryGuestId },
            data: { email },
          });
          this.logger.warn(
            `Guest ${booking.primaryGuestId} re-addressed ${booking.primaryGuest.email} → ${email} (their only booking, and nobody holds the new address)`,
          );
          // Name and number still want reconciling, and the guest now answers
          // to the new address, so the ordinary path below does it.
        } catch {
          // Somebody claimed the address between the check and the write.
          // Rare, and not worth failing a sync over — fall through and move
          // the booking to them instead, which is what they now are.
          this.logger.warn(
            `Re-address to ${email} collided; moving the booking instead`,
          );
        }
      }
    }

    // Resolved on every poll, not only when the address changed. A corrected
    // name or number arrives under the same email as before, so returning
    // early on a match would let exactly those through unseen.
    const guest = await this.findOrCreateGuest(email, lodgifyData);
    if (guest.id === booking.primaryGuestId) return;

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { primaryGuestId: guest.id },
    });

    // A booking changing hands with no human involved has to be answerable
    // later — not least because the guest it left keeps their other stays and
    // will look shorter than they did yesterday.
    await this.prisma.auditLog.create({
      data: {
        action: 'BOOKING_UPDATED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: 'system',
        performedByRole: 'system',
        bookingId,
        afterState: {
          reason: 'Re-filed under the guest Lodgify names on the reservation',
          from: booking.primaryGuest.email,
          to: email,
        } as any,
      },
    });

    this.logger.warn(
      `Booking ${bookingId} moved from ${booking.primaryGuest.email} to ${email} — Lodgify names the latter`,
    );
  }

  async updateFromLodgify(lodgifyData: any) {
    const baseRate =
      lodgifyData.total_price != null
        ? Number(lodgifyData.total_price)
        : undefined;

    const peopleCount = Number(lodgifyData.people_count);

    // A cancelled booking Lodgify is still selling comes back.
    //
    // This path is only reached for a reservation that passed the mapper —
    // Lodgify actively counts it as a stay. So a CANCELLED row arriving here
    // is a disagreement, and Lodgify is the source of truth for whether a
    // reservation exists. Until now status was never written on update, so the
    // disagreement was permanent: a booking cancelled in error stayed
    // cancelled through every five-minute poll for ever, invisible in Guests
    // and Folio while Lodgify showed it as Booked.
    //
    // That is not hypothetical. The old deletion reconciler judged a booking
    // absent if it missed one page of results, and there was no way back.
    //
    // Only CANCELLED is reversed. CHECKED_OUT and SETTLED are things the
    // estate did to a stay it housed, and no sync should undo them.
    const current = await this.prisma.booking.findUnique({
      where: { lodgifyId: String(lodgifyData.id) },
      select: { id: true, status: true },
    });

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
        ...(current?.status === 'CANCELLED'
          ? { status: BookingStatus.CONFIRMED }
          : {}),
        lodgifyRawData: lodgifyData,
      },
    });

    if (current?.status === 'CANCELLED') {
      await this.prisma.auditLog.create({
        data: {
          action: 'BOOKING_STATUS_CHANGED',
          entityType: 'Booking',
          entityId: booking.id,
          performedBy: 'system',
          performedByRole: 'system',
          bookingId: booking.id,
          afterState: {
            status: 'CONFIRMED',
            reason: 'Lodgify still holds this reservation — un-cancelled',
            lodgifyId: String(lodgifyData.id),
          } as any,
        },
      });
      this.logger.warn(
        `Restored booking ${booking.id} to CONFIRMED — Lodgify still holds ${lodgifyData.id}`,
      );
    }

    // The guest's own details are reconciled by reconcileGuestFromLodgify,
    // which the caller runs straight after this. There was a name backfill
    // here too — a second copy of the same rules, reached by a different
    // route, and the two would have started disagreeing the moment either
    // learned something the other did not.

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

  /**
   * Cancels bookings Lodgify no longer holds.
   *
   * `confirm` is passed in rather than injected. LodgifyModule already imports
   * BookingsModule, so reaching the other way would need a forwardRef on both
   * sides to resolve a cycle that only exists because of one call — and the
   * poller, the sole caller, holds both services already.
   */
  async reconcileDeletedFromLodgify(
    items: any[],
    confirm: (lodgifyId: string) => Promise<ReservationPresence>,
  ): Promise<number> {
    if (process.env.LODGIFY_RECONCILE_DELETIONS === 'false') return 0;

    // An outage, a bad token, or a filtered query all return zero rows — which
    // looks exactly like "every reservation was deleted". Never act on it.
    if (items.length === 0) {
      this.logger.warn(
        'Lodgify returned no bookings — skipping reconciliation',
      );
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

    // A booking created moments ago (webhook) may post-date the poll's own
    // request, so give it room before treating it as missing.
    const createdBefore = new Date(Date.now() - RECONCILE_GRACE_MS);

    // Every live booking, judged on its own merits.
    //
    // This used to be narrowed to a date window inferred from the reservations
    // Lodgify happened to return — earliest arrival to latest departure. The
    // guard was meant to survive Lodgify filtering its response, but it was a
    // ratchet: as old reservations aged off the list, the window closed from
    // the left, and anything below it became permanently unreachable. A test
    // booking for 5–11 August sat in Guests as an arriving party for weeks
    // because the earliest live reservation arrived on the 29th, and no
    // number of polls could ever consider it.
    //
    // Absence from one page is no longer the verdict — it only nominates a
    // candidate, and the verdict comes from asking Lodgify about that
    // reservation directly. That is a better guard than the window was, and
    // it holds against the two things the window was really protecting
    // against: a filtered response, and a list truncated at one page.
    const candidates = await this.prisma.booking.findMany({
      where: {
        status: { notIn: ['CHECKED_OUT', 'CANCELLED'] },
        createdAt: { lt: createdBefore },
      },
      select: { id: true, lodgifyId: true },
    });

    const missing = candidates.filter(
      (b) => b.lodgifyId && !seen.has(b.lodgifyId),
    );
    if (missing.length === 0) return 0;

    const cancelled: { id: string; lodgifyId: string; reason: string }[] = [];

    // Sequential on purpose. These are rare — a booking absent from the page
    // is already the exception — and a burst of parallel calls to Lodgify on
    // every five-minute poll is a worse trade than a few extra seconds.
    for (const booking of missing) {
      const presence = await confirm(booking.lodgifyId);

      if (presence.state === 'present') continue;
      if (presence.state === 'unknown') {
        // Could not find out. Leaving it alone costs one more poll; guessing
        // costs a real stay.
        this.logger.warn(
          `Booking ${booking.id} absent from the Lodgify page but unconfirmed — left alone`,
        );
        continue;
      }

      cancelled.push({
        id: booking.id,
        lodgifyId: booking.lodgifyId,
        reason:
          presence.state === 'gone'
            ? 'no longer exists in Lodgify'
            : `Lodgify reports it as "${presence.reason}"`,
      });
    }

    if (cancelled.length === 0) return 0;

    await this.prisma.booking.updateMany({
      where: { id: { in: cancelled.map((b) => b.id) } },
      data: { status: 'CANCELLED' },
    });

    // Recorded per booking — this cancels a stay without a human involved, so
    // it needs to be answerable later.
    await this.prisma.auditLog.createMany({
      data: cancelled.map((b) => ({
        action: 'BOOKING_STATUS_CHANGED',
        entityType: 'Booking',
        entityId: b.id,
        performedBy: 'system',
        performedByRole: 'system',
        bookingId: b.id,
        afterState: {
          status: 'CANCELLED',
          reason: b.reason,
          lodgifyId: b.lodgifyId,
        } as any,
      })),
    });

    this.logger.warn(
      `Cancelled ${cancelled.length} booking(s) confirmed gone from Lodgify: ${cancelled
        .map((b) => `${b.lodgifyId} (${b.reason})`)
        .join(', ')}`,
    );

    return cancelled.length;
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
