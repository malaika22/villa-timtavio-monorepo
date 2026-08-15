import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { MagicLinkService } from '../auth0/magic-link.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateManifestGuestDto } from './dto/create-manifest-guest.dto';
import { UpdateManifestGuestDto } from './dto/update-manifest-guest.dto';
import { UpsertManifestDraftDto } from './dto/upsert-manifest-draft.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class ManifestService {
  private readonly logger = new Logger(ManifestService.name);

  constructor(
    private prisma: PrismaService,
    private magicLinkService: MagicLinkService,
    private notificationsService: NotificationsService,
    private pusherService: PusherService,
  ) {}

  // ─── Get full manifest for a booking ─────────────────────────────────────

  async getManifest(bookingId: string, requestingUserEmail?: string) {
    const booking = await this.prisma.booking.findUnique({
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
            beveragePreferences: true,
          },
        },
        manifestGuests: {
          orderBy: { createdAt: 'asc' },
          include: {
            room: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Build room summary — which rooms have how many guests
    const roomSummary = await this.getRoomSummary(bookingId);

    // Experiences each guest has requested, grouped by requester email so the
    // primary can see "what experiences they've ordered" per guest.
    const requests = await this.prisma.experienceRequest.findMany({
      where: { bookingId },
      include: { catalogItem: { select: { name: true, category: true } } },
      orderBy: [{ preferredDate: 'asc' }, { preferredTime: 'asc' }],
    });

    const byEmail = new Map<string, typeof requests>();
    for (const req of requests) {
      const key = req.requestedByEmail.toLowerCase();
      const list = byEmail.get(key) ?? [];
      list.push(req);
      byEmail.set(key, list);
    }

    const toSummary = (req: (typeof requests)[number]) => ({
      id: req.id,
      name: req.catalogItem.name,
      category: req.catalogItem.category,
      status: req.status,
      preferredDate: req.preferredDate,
      preferredTime: req.preferredTime,
      confirmedDate: req.confirmedDate,
      confirmedTime: req.confirmedTime,
    });

    const guests = booking.manifestGuests.map((guest) => ({
      ...guest,
      experiences: (byEmail.get(guest.email.toLowerCase()) ?? []).map(toSummary),
    }));

    // Progress.
    //
    // The primary isn't a manifestGuest row, so they have to be counted
    // separately — but they used to be added with an unconditional `+ 1`,
    // which counted them as done by definition rather than by evidence. The
    // bar therefore hit 100% the moment the last secondary was added, telling
    // a primary who had picked no room and entered nothing that they had
    // finished. They then submitted, and the estate discovered the gap at
    // check-in.
    //
    // A room is the minimum: it's the one thing the estate cannot work around,
    // and it's per-stay rather than per-guest so it can only be set here.
    const primaryComplete = booking.primaryRoomNumber != null;
    const totalGuests = booking.totalGuests;
    const addedGuests = booking.manifestGuests.length + (primaryComplete ? 1 : 0);
    const progressPercent =
      totalGuests > 0
        ? Math.min(100, Math.round((addedGuests / totalGuests) * 100))
        : 0;

    // The most recent edit anywhere in the party. Compared by the dashboard
    // against manifestBriefViewedAt to warn that something moved after the
    // brief went to the chef — a late allergy reaches the run sheet on its own,
    // but it does not reach a WhatsApp message Rodrigo already sent.
    const manifestLastChangedAt = booking.manifestGuests.reduce<Date | null>(
      (latest, g) => (!latest || g.updatedAt > latest ? g.updatedAt : latest),
      null,
    );

    return {
      bookingId,
      manifestStatus: booking.manifestStatus,
      manifestLastChangedAt,
      manifestBriefViewedAt: booking.manifestBriefViewedAt,
      manifestBriefViewedBy: booking.manifestBriefViewedBy,
      totalGuests,
      addedGuests,
      progressPercent,
      /**
       * Whether the primary has finished their own entry. Surfaced so the app
       * can ask them to complete it rather than implying — with a full bar —
       * that there is nothing left to do.
       */
      primaryComplete,
      primaryGuest: {
        ...booking.primaryGuest,
        // Room + presence are per-stay (Booking); dietary/allergies/beverage
        // come straight from the primary's Guest record.
        roomNumber: booking.primaryRoomNumber,
        arrivalStatus: booking.primaryArrivalStatus,
        // The primary's own experience requests, so the Party hub can show the
        // whole party's experiences (primary + secondaries) in one place.
        experiences: (
          byEmail.get(booking.primaryGuest.email.toLowerCase()) ?? []
        ).map(toSummary),
      },
      guests,
      roomSummary,
    };
  }

  // ─── Add a guest to the manifest ─────────────────────────────────────────

  async addGuest(
    bookingId: string,
    dto: CreateManifestGuestDto,
    addedByEmail: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        manifestGuests: true,
        primaryGuest: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only primary member or estate manager can add guests
    if (
      addedByEmail !== booking.primaryGuest.email &&
      !addedByEmail.startsWith('auth0|') // estate manager check
    ) {
      throw new ForbiddenException('Only the primary member can add guests');
    }

    // Enforce max capacity of 16
    if (booking.manifestGuests.length >= 16) {
      throw new BadRequestException(
        'Maximum guest capacity of 16 has been reached',
      );
    }

    // Prevent duplicate email in same booking
    const existingGuest = booking.manifestGuests.find(
      (g) => g.email.toLowerCase() === dto.email.toLowerCase(),
    );
    if (existingGuest) {
      throw new BadRequestException(
        `A guest with email ${dto.email} is already in this manifest`,
      );
    }

    // Validate room capacity if room assigned
    if (dto.roomNumber) {
      await this.validateRoomCapacity(bookingId, dto.roomNumber);
    }

    // Prevent adding primary member's email as a secondary guest
    if (dto.email.toLowerCase() === booking.primaryGuest.email.toLowerCase()) {
      throw new BadRequestException(
        'The primary member is already part of the booking',
      );
    }

    const guest = await this.prisma.manifestGuest.create({
      data: {
        bookingId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        relationship: dto.relationship,
        roomNumber: dto.roomNumber,
        dietaryRestrictions: dto.dietaryRestrictions || [],
        dietaryOtherDetails: dto.dietaryOtherDetails,
        allergies: dto.allergies,
        beveragePreferences: dto.beveragePreferences,
        specialNotes: dto.specialNotes,
      },
      include: { room: true },
    });

    // Update manifest status to IN_PROGRESS if it was INCOMPLETE
    if (booking.manifestStatus === 'INCOMPLETE') {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { manifestStatus: 'IN_PROGRESS' },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'MANIFEST_GUEST_ADDED',
        entityType: 'ManifestGuest',
        entityId: guest.id,
        performedBy: addedByEmail,
        performedByRole: 'primary_member',
        bookingId,
        metadata: {
          guestName: `${dto.firstName} ${dto.lastName}`,
          roomNumber: dto.roomNumber,
        } as any,
      },
    });

    this.logger.log(
      `Added guest ${dto.firstName} ${dto.lastName} to booking ${bookingId}`,
    );

    // Access on being added, not on the manifest being approved. Approval is a
    // check-in readiness gate; it only ever governed access because everything
    // used to begin at arrival. A guest added in August should be able to plan
    // in August. Best-effort — a failed send must not lose the guest.
    if (guest.email) {
      await this.magicLinkService
        .sendMagicLink({
          email: guest.email,
          firstName: guest.firstName,
          lastName: guest.lastName,
          bookingId,
          role: 'secondary_guest',
          guestTier: 'secondary',
          checkOutDate: booking.checkOut,
        })
        .then(() =>
          this.prisma.manifestGuest.update({
            where: { id: guest.id },
            data: { pwaLinkSent: true },
          }),
        )
        .catch((err) =>
          this.logger.error(
            `Link to ${guest.email} failed: ${String(err)} — Rodrigo can resend`,
          ),
        );
    }

    return guest;
  }

  // ─── Update a guest in the manifest ──────────────────────────────────────

  /**
   * The fields a guest may change about themselves.
   *
   * Everything here is personal knowledge — nobody knows their own allergy
   * better than they do, and it's the allergy the kitchen run sheet quotes.
   * What's absent is deliberate:
   *
   *   `email`     — their sign-in is scoped to it. Letting them change it is
   *                 how someone locks themselves out with no way back in.
   *   `roomNumber`— a party-level decision. If any guest could reassign
   *                 themselves, whoever opens the app first takes the master
   *                 suite and the person paying loses the choice.
   *
   * Both remain editable by the primary member and by the estate.
   */
  private static readonly SELF_EDITABLE = [
    'firstName',
    'lastName',
    'phone',
    'dateOfBirth',
    'dietaryRestrictions',
    'dietaryOtherDetails',
    'allergies',
    'beveragePreferences',
    'specialNotes',
  ] as const;

  async updateGuest(
    bookingId: string,
    guestId: string,
    dto: UpdateManifestGuestDto,
    updatedByEmail: string,
    /** Set for a secondary guest editing themselves; absent for primary/estate. */
    selfEditOnly = false,
  ) {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: guestId },
    });

    if (!guest || guest.bookingId !== bookingId) {
      throw new NotFoundException('Guest not found in this manifest');
    }

    if (selfEditOnly) {
      // Their own record only. The manifest is unique on (bookingId, email),
      // so the token's email is the whole of the identity check.
      if (guest.email.toLowerCase() !== updatedByEmail.toLowerCase()) {
        throw new ForbiddenException(
          'You can only change your own details. Ask the lead guest or the estate for anything else.',
        );
      }

      const forbidden = Object.keys(dto).filter(
        (k) =>
          dto[k as keyof UpdateManifestGuestDto] !== undefined &&
          !(ManifestService.SELF_EDITABLE as readonly string[]).includes(k),
      );
      if (forbidden.length > 0) {
        throw new ForbiddenException(
          forbidden.includes('email')
            ? 'Your email is how you sign in — the estate can change it for you.'
            : 'Rooms and the guest list are set by the lead guest.',
        );
      }
    }

    // If room is being changed, validate new room capacity
    if (dto.roomNumber && dto.roomNumber !== guest.roomNumber) {
      await this.validateRoomCapacity(bookingId, dto.roomNumber, guestId);
    }

    const updated = await this.prisma.manifestGuest.update({
      where: { id: guestId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        relationship: dto.relationship,
        roomNumber: dto.roomNumber,
        dietaryRestrictions: dto.dietaryRestrictions,
        dietaryOtherDetails: dto.dietaryOtherDetails,
        allergies: dto.allergies,
        beveragePreferences: dto.beveragePreferences,
        specialNotes: dto.specialNotes,
      },
      include: { room: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MANIFEST_GUEST_UPDATED',
        entityType: 'ManifestGuest',
        entityId: guestId,
        performedBy: updatedByEmail,
        performedByRole: 'primary_member',
        bookingId,
        metadata: {
          guestName: `${updated.firstName} ${updated.lastName}`,
          updatedFields: Object.keys(dto),
        } as any,
      },
    });

    return updated;
  }

  // ─── Remove a guest from the manifest ────────────────────────────────────

  async removeGuest(
    bookingId: string,
    guestId: string,
    removedByEmail: string,
  ) {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: guestId },
    });

    if (!guest || guest.bookingId !== bookingId) {
      throw new NotFoundException('Guest not found in this manifest');
    }

    // Removal used to be blocked once a link had been sent, on the reasoning
    // that a sent link meant a committed guest. Links now go out the moment a
    // guest is added, so that rule would freeze the party list for weeks — the
    // primary could never correct a mistake.
    //
    // Safe to allow because access genuinely goes with them: pending links are
    // deleted here, and the JWT strategy re-checks manifest membership on every
    // request, so an already-issued token stops working immediately.
    await this.prisma.magicToken.deleteMany({
      where: {
        bookingId,
        email: { equals: guest.email, mode: 'insensitive' },
      },
    });

    await this.prisma.manifestGuest.delete({ where: { id: guestId } });

    await this.prisma.auditLog.create({
      data: {
        action: 'MANIFEST_GUEST_REMOVED',
        entityType: 'ManifestGuest',
        entityId: guestId,
        performedBy: removedByEmail,
        performedByRole: 'primary_member',
        bookingId,
        metadata: {
          guestName: `${guest.firstName} ${guest.lastName}`,
        } as any,
      },
    });

    // If no guests remain, revert to INCOMPLETE
    const remainingCount = await this.prisma.manifestGuest.count({
      where: { bookingId },
    });

    if (remainingCount === 0) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { manifestStatus: 'INCOMPLETE' },
      });
    }

    return { success: true };
  }

  // ─── Primary member submits manifest ─────────────────────────────────────

  async submitManifest(bookingId: string, submittedByEmail: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: true,
        manifestGuests: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.primaryGuest.email !== submittedByEmail) {
      throw new ForbiddenException(
        'Only the primary member can submit the manifest',
      );
    }

    if (booking.manifestGuests.length === 0) {
      throw new BadRequestException('Add at least one guest before submitting');
    }

    // The primary isn't a manifestGuest row, so nothing in the loop above ever
    // checked them — a primary could add their party, submit, and leave the
    // estate to discover at check-in that the person paying had no room. The
    // progress card already knew this (`primaryComplete`); it simply had no
    // way to stop the submission.
    if (booking.primaryRoomNumber == null) {
      throw new BadRequestException(
        'Choose your own room before submitting. The estate can work around most things, but not who is sleeping where.',
      );
    }

    // Re-submitting is fine. Submission means "the estate can act on this
    // now", not "this is final" — the party keeps changing right up to
    // arrival, and refusing the second submit only sent them to the telephone.
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { manifestStatus: 'SUBMITTED' },
    });

    // Create system alert for Rodrigo
    await this.prisma.systemAlert.create({
      data: {
        severity: 'WARNING',
        title: 'Manifest submitted — review required',
        message: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName} submitted guest manifest — ${booking.manifestGuests.length} guests added`,
        category: 'BOOKING',
        entityType: 'Booking',
        entityId: bookingId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MANIFEST_SUBMITTED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: submittedByEmail,
        performedByRole: 'primary_member',
        bookingId,
        metadata: {
          guestCount: booking.manifestGuests.length,
        } as any,
      },
    });

    await this.pusherService.manifestSubmittedToEm({
      bookingId,
      primaryGuestName: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`,
      guestCount: booking.manifestGuests.length,
    });

    this.logger.log(
      `Manifest submitted for booking ${bookingId} — ${booking.manifestGuests.length} guests`,
    );

    return {
      success: true,
      guestsAdded: booking.manifestGuests.length,
      manifestStatus: 'SUBMITTED',
    };
  }

  // ─── Rodrigo approves manifest + sends secondary guest links ─────────────

  /**
   * The estate acknowledging the guest list — what "approve" used to be.
   *
   * Approval was retired because it gated nothing: secondary guests receive
   * their access the moment they are added, and Rodrigo has no way to verify
   * a guest list he wasn't part of assembling. Clicking it was theatre.
   *
   * What it did carry, and what survives here, is the moment the estate read
   * the brief. That timestamp is the whole basis of "changed since you last
   * looked" — the thing that protects the kitchen when a guest adds an allergy
   * after the brief was forwarded to the chef. It also clears the submitted
   * alert, which otherwise had nothing left to dismiss it.
   */
  async markBriefViewed(bookingId: string, viewedBy: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const [updated] = await Promise.all([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          manifestBriefViewedAt: new Date(),
          manifestBriefViewedBy: viewedBy,
        },
        select: { manifestBriefViewedAt: true, manifestBriefViewedBy: true },
      }),
      this.prisma.systemAlert.updateMany({
        where: {
          entityType: 'Booking',
          entityId: bookingId,
          isDismissed: false,
        },
        data: {
          isDismissed: true,
          dismissedBy: viewedBy,
          dismissedAt: new Date(),
        },
      }),
    ]);

    return updated;
  }

  // ─── Generate chef's brief ────────────────────────────────────────────────

  async generateChefsBrief(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        primaryGuest: {
          select: {
            firstName: true,
            lastName: true,
            dietaryRestrictions: true,
            allergies: true,
            beveragePreferences: true,
          },
        },
        manifestGuests: {
          include: { room: true },
          orderBy: { roomNumber: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Build structured brief from all guests
    const allGuests = [
      {
        name: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName} (Primary)`,
        dietaryRestrictions: booking.primaryGuest.dietaryRestrictions,
        allergies: booking.primaryGuest.allergies,
        beveragePreferences: booking.primaryGuest.beveragePreferences,
        room: 'Primary member',
      },
      ...booking.manifestGuests.map((g) => ({
        name: `${g.firstName} ${g.lastName}`,
        dietaryRestrictions: g.dietaryRestrictions,
        allergies: g.allergies,
        beveragePreferences: g.beveragePreferences,
        room: g.room
          ? `Room ${g.roomNumber} — ${g.room.name}`
          : 'Room not assigned',
      })),
    ];

    // Aggregate restrictions across all guests
    const allRestrictions: Record<string, string[]> = {};
    const allAllergies: { guest: string; allergy: string }[] = [];
    const allBeveragePrefs: { guest: string; preference: string }[] = [];

    for (const guest of allGuests) {
      for (const restriction of guest.dietaryRestrictions || []) {
        if (!allRestrictions[restriction]) {
          allRestrictions[restriction] = [];
        }
        allRestrictions[restriction].push(guest.name);
      }

      if (guest.allergies) {
        allAllergies.push({ guest: guest.name, allergy: guest.allergies });
      }

      if (guest.beveragePreferences) {
        allBeveragePrefs.push({
          guest: guest.name,
          preference: guest.beveragePreferences,
        });
      }
    }

    return {
      bookingId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalGuests: allGuests.length,
      generatedAt: new Date(),
      summary: {
        totalRestrictions: Object.keys(allRestrictions).length,
        totalAllergies: allAllergies.length,
        totalBeveragePrefs: allBeveragePrefs.length,
      },
      dietaryRestrictions: allRestrictions,
      allergies: allAllergies,
      beveragePreferences: allBeveragePrefs,
      guestBreakdown: allGuests,
    };
  }

  // ─── Resend PWA link to a specific secondary guest ────────────────────────

  async resendGuestLink(bookingId: string, guestId: string, resentBy: string) {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: guestId },
      include: { booking: true },
    });

    if (!guest || guest.bookingId !== bookingId) {
      throw new NotFoundException('Guest not found in this manifest');
    }

    // No approval check. Links now go out the moment a guest is added, so
    // requiring approval here meant the estate couldn't resend to the one
    // person who says they never got theirs — which is the only reason this
    // endpoint exists.
    await this.magicLinkService.sendMagicLink({
      email: guest.email,
      firstName: guest.firstName,
      lastName: guest.lastName,
      bookingId,
      role: 'secondary_guest',
      guestTier: 'secondary',
      checkOutDate: guest.booking.checkOut,
    });

    await this.prisma.manifestGuest.update({
      where: { id: guestId },
      data: { pwaLinkSent: true, pwaLinkSentAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MAGIC_LINK_RESENT',
        entityType: 'ManifestGuest',
        entityId: guestId,
        performedBy: resentBy,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: { email: guest.email } as any,
      },
    });

    return { success: true, email: guest.email };
  }

  // ─── Mark PWA link as opened ──────────────────────────────────────────────

  async markLinkOpened(bookingId: string, email: string) {
    await this.prisma.manifestGuest.updateMany({
      where: { bookingId, email },
      data: { pwaLinkOpened: true, pwaLinkOpenedAt: new Date() },
    });
    return { success: true };
  }

  // ─── Get manifest form options ────────────────────────────────────────────

  getOptions() {
    return {
      dietaryRestrictions: [
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'vegan', label: 'Vegan' },
        { value: 'gluten_free', label: 'Gluten-free' },
        { value: 'halal', label: 'Halal' },
        { value: 'kosher', label: 'Kosher' },
        { value: 'no_shellfish', label: 'No shellfish' },
        { value: 'no_nuts', label: 'No nuts' },
        { value: 'no_dairy', label: 'No dairy' },
        { value: 'other', label: 'Other' },
      ],
      relationships: [
        { value: 'partner', label: 'Partner' },
        { value: 'family', label: 'Family' },
        { value: 'friend', label: 'Friend' },
        { value: 'colleague', label: 'Colleague' },
        { value: 'other', label: 'Other' },
      ],
    };
  }

  // ─── Get draft for a booking ──────────────────────────────────────────────

  async getDraft(bookingId: string) {
    const draft = await this.prisma.manifestDraft.findUnique({
      where: { bookingId },
    });
    if (!draft) return null;
    return {
      bookingId: draft.bookingId,
      data: draft.data as Record<string, unknown>,
      guestId: draft.guestId,
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  // ─── Upsert draft for a booking ───────────────────────────────────────────

  async upsertDraft(bookingId: string, dto: UpsertManifestDraftDto) {
    const draft = await this.prisma.manifestDraft.upsert({
      where: { bookingId },
      update: {
        data: dto.data as any,
        guestId: dto.guestId ?? null,
      },
      create: {
        bookingId,
        data: dto.data as any,
        guestId: dto.guestId ?? null,
      },
    });
    return {
      bookingId: draft.bookingId,
      data: draft.data as Record<string, unknown>,
      guestId: draft.guestId,
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  // ─── Delete draft for a booking ───────────────────────────────────────────

  async deleteDraft(bookingId: string) {
    await this.prisma.manifestDraft.deleteMany({ where: { bookingId } });
    return { success: true };
  }

  // ─── Private: Validate room capacity ─────────────────────────────────────

  private async validateRoomCapacity(
    bookingId: string,
    roomNumber: number,
    excludeGuestId?: string,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { number: roomNumber },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomNumber} not found`);
    }

    if (!room.isActive) {
      throw new BadRequestException(`Room ${roomNumber} is not available`);
    }

    const where: any = { bookingId, roomNumber };
    if (excludeGuestId) {
      where.id = { not: excludeGuestId };
    }

    const assignedCount = await this.prisma.manifestGuest.count({ where });

    if (assignedCount >= room.capacity) {
      throw new BadRequestException(
        `Room ${roomNumber} (${room.name}) is at full capacity (${room.capacity} guests max)`,
      );
    }
  }

  // ─── Private: Get room summary ────────────────────────────────────────────

  // ─── Primary member: update their own manifest details (room + prefs) ─────

  async updatePrimaryDetails(
    bookingId: string,
    dto: {
      roomNumber?: number | null;
      dietaryRestrictions?: string[];
      allergies?: string | null;
      beveragePreferences?: string | null;
    },
    requestingEmail?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        primaryGuestId: true,
        primaryGuest: { select: { email: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Only the booking's own primary (or an estate manager) may edit these
    // details. EM tokens surface as an auth0| subject in `requestingEmail`.
    if (
      requestingEmail &&
      requestingEmail !== booking.primaryGuest.email &&
      !requestingEmail.startsWith('auth0|')
    ) {
      throw new ForbiddenException(
        'You can only update your own manifest details',
      );
    }

    // Room is per-stay → Booking. Dietary/allergies/beverage are guest-intrinsic
    // → the primary's Guest record, which the chef's brief / guest DNA / CRM read.
    const guestData = {
      ...(dto.dietaryRestrictions !== undefined
        ? { dietaryRestrictions: dto.dietaryRestrictions }
        : {}),
      ...(dto.allergies !== undefined ? { allergies: dto.allergies } : {}),
      ...(dto.beveragePreferences !== undefined
        ? { beveragePreferences: dto.beveragePreferences }
        : {}),
    };

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data:
          dto.roomNumber !== undefined
            ? { primaryRoomNumber: dto.roomNumber }
            : {},
      }),
      ...(Object.keys(guestData).length > 0
        ? [
            this.prisma.guest.update({
              where: { id: booking.primaryGuestId },
              data: guestData,
            }),
          ]
        : []),
    ]);

    return this.getManifest(bookingId);
  }

  // ─── Estate Manager: per-guest / primary presence status (REQ-5) ──────────

  private assertArrivalStatus(status: string) {
    if (!['EXPECTED', 'IN_VILLA', 'DEPARTED'].includes(status)) {
      throw new BadRequestException('Invalid arrival status');
    }
  }

  async setGuestArrivalStatus(guestId: string, status: string) {
    this.assertArrivalStatus(status);
    return this.prisma.manifestGuest.update({
      where: { id: guestId },
      data: { arrivalStatus: status as any },
    });
  }

  async setPrimaryArrivalStatus(bookingId: string, status: string) {
    this.assertArrivalStatus(status);
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { primaryArrivalStatus: status as any },
    });
  }

  private async getRoomSummary(bookingId: string) {
    const [booking, rooms] = await Promise.all([
      this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { primaryRoomNumber: true },
      }),
      this.prisma.room.findMany({
        where: { isActive: true },
        orderBy: { number: 'asc' },
        include: {
          manifestGuests: {
            where: { bookingId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dietaryRestrictions: true,
              allergies: true,
              pwaLinkSent: true,
              pwaLinkOpened: true,
            },
          },
        },
      }),
    ]);
    const primaryRoom = booking?.primaryRoomNumber ?? null;

    // Field names must match the shared RoomSummaryItem type (roomNumber /
    // roomName / assignedGuests). Occupancy includes the primary's own room.
    return rooms.map((room) => {
      const assigned =
        room.manifestGuests.length + (primaryRoom === room.number ? 1 : 0);
      return {
        roomNumber: room.number,
        roomName: room.name,
        capacity: room.capacity,
        assignedGuests: assigned,
        availableCapacity: room.capacity - assigned,
      };
    });
  }
}
