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

    // Calculate progress
    const totalGuests = booking.totalGuests;
    const addedGuests = booking.manifestGuests.length;
    const progressPercent = Math.round((addedGuests / 16) * 100);

    return {
      bookingId,
      manifestStatus: booking.manifestStatus,
      totalGuests,
      addedGuests,
      progressPercent,
      primaryGuest: booking.primaryGuest,
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

    return guest;
  }

  // ─── Update a guest in the manifest ──────────────────────────────────────

  async updateGuest(
    bookingId: string,
    guestId: string,
    dto: UpdateManifestGuestDto,
    updatedByEmail: string,
  ) {
    const guest = await this.prisma.manifestGuest.findUnique({
      where: { id: guestId },
    });

    if (!guest || guest.bookingId !== bookingId) {
      throw new NotFoundException('Guest not found in this manifest');
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

    // Cannot remove a guest whose PWA link has already been sent
    if (guest.pwaLinkSent) {
      throw new BadRequestException(
        'Cannot remove a guest after their PWA link has been sent. Contact the estate to make changes.',
      );
    }

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

    if (booking.manifestStatus === 'APPROVED') {
      throw new BadRequestException(
        'Manifest has already been approved. Contact the estate to make changes.',
      );
    }

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

  async approveManifest(bookingId: string, approvedBy: string) {
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

    if (booking.manifestStatus !== 'SUBMITTED') {
      throw new BadRequestException(
        'Manifest must be in SUBMITTED status to approve',
      );
    }

    // Update manifest status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { manifestStatus: 'APPROVED' },
    });

    // Send magic links to all secondary guests
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

    // Notify primary member that manifest was approved
    await this.notificationsService.send({
      bookingId,
      recipientEmail: booking.primaryGuest.email,
      type: 'MANIFEST_APPROVED',
      title: 'Guest list approved',
      body: `Your guest list has been approved. ${sent} of ${booking.manifestGuests.length} guests will receive access links shortly.`,
      deepLink: '/manifest',
    });

    // Dismiss the system alert
    await this.prisma.systemAlert.updateMany({
      where: {
        entityType: 'Booking',
        entityId: bookingId,
        isDismissed: false,
      },
      data: {
        isDismissed: true,
        dismissedBy: approvedBy,
        dismissedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'MANIFEST_APPROVED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: approvedBy,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: {
          guestCount: booking.manifestGuests.length,
          linksSent: sent,
          linksFailed: failed,
        } as any,
      },
    });

    this.logger.log(
      `Manifest approved for booking ${bookingId}. ${sent} links sent, ${failed} failed`,
    );

    return {
      success: true,
      manifestStatus: 'APPROVED',
      linksSent: sent,
      linksFailed: failed,
      totalGuests: booking.manifestGuests.length,
    };
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

    if (guest.booking.manifestStatus !== 'APPROVED') {
      throw new BadRequestException(
        'Manifest must be approved before sending guest links',
      );
    }

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

  private async getRoomSummary(bookingId: string) {
    const rooms = await this.prisma.room.findMany({
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
    });

    return rooms.map((room) => ({
      number: room.number,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      bedConfig: room.bedConfig,
      assignedCount: room.manifestGuests.length,
      availableCapacity: room.capacity - room.manifestGuests.length,
      isFull: room.manifestGuests.length >= room.capacity,
      isEmpty: room.manifestGuests.length === 0,
      guests: room.manifestGuests,
    }));
  }
}
