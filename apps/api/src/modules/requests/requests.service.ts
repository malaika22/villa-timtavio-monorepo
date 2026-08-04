import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { BreezeWayService } from '../breezeway/breezeway.service';
import { ConflictService } from './conflict.service';
import { PusherService } from '../pusher/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRequestDto,
  ConfirmRequestDto,
  DeclineRequestDto,
} from './dto/create-request.dto';
import {
  BREEZEWAY_ASSIGNEE_MAP,
  EXPERIENCE_LEAD_TIMES,
  isWithinTaskWindow,
} from '../breezeway/breezeway.config';
import { derivePrimaryRoomNumber } from '../../common/booking-room.util';
import { getErrorMessage } from '../../commons/utils/error.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  computeEstimate,
  formatPrice,
  quoteNeedsReapproval,
  toNumber,
} from '../../common/pricing.util';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private prisma: PrismaService,
    private breezeWayService: BreezeWayService,
    private pusherService: PusherService,
    private notificationsService: NotificationsService,
    private conflictService: ConflictService,
  ) {}

  // ─── Submit request ───────────────────────────────────────────────────────

  async create(
    bookingId: string,
    dto: CreateRequestDto,
    requestedBy: { email: string; name: string; tier: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const catalogItem = await this.prisma.catalogItem.findUnique({
      where: { id: dto.catalogItemId },
      include: { priceUnit: true },
    });
    if (!catalogItem) throw new NotFoundException('Experience not found');
    if (!catalogItem.isActive) {
      throw new BadRequestException('Experience is not available');
    }

    // guestCount multiplies a per-person rate, so it's a money input — bound it
    // server-side rather than trusting the client's stepper.
    if (dto.guestCount < 1) {
      throw new BadRequestException('At least one guest must be attending');
    }
    if (
      catalogItem.maxGuestCount != null &&
      dto.guestCount > catalogItem.maxGuestCount
    ) {
      throw new BadRequestException(
        `${catalogItem.name} takes up to ${catalogItem.maxGuestCount} guests`,
      );
    }

    // The requested date must fall inside the stay.
    //
    // The picker now greys out everything else, but a picker is a courtesy —
    // the rule belongs where it can't be skipped. Booking a vendor for a day
    // the guest isn't at the villa costs the estate a supplier and nobody
    // notices until the date.
    const preferred = new Date(dto.preferredDate);
    if (!Number.isNaN(preferred.getTime())) {
      const day = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const requested = day(preferred);
      if (
        requested < day(new Date(booking.checkIn)) ||
        requested > day(new Date(booking.checkOut))
      ) {
        throw new BadRequestException(
          'Experiences can only be arranged for dates during your stay.',
        );
      }
    }

    // Check for duplicate active request
    const activeRequest = await this.prisma.experienceRequest.findFirst({
      where: {
        bookingId,
        catalogItemId: dto.catalogItemId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY'] },
      },
    });
    if (activeRequest) {
      throw new BadRequestException(
        'An active request for this experience already exists',
      );
    }

    // Superyacht model:
    // Secondary guest requests require primary member approval before
    // going to Rodrigo's queue
    const isSecondary = requestedBy.tier === 'secondary';
    const requiresPrimaryApproval = isSecondary && !catalogItem.isIncluded;

    // Snapshot the estimate the guest was shown, so later catalog edits can't
    // rewrite the figure the primary approved — and so the hard quote has a
    // fixed number to be measured against.
    const estimate = computeEstimate(
      {
        basePrice: toNumber(catalogItem.basePrice),
        priceMax: toNumber(catalogItem.priceMax),
        priceUnit: catalogItem.priceUnit,
      },
      { guestCount: dto.guestCount, nights: booking.nights },
    );

    const request = await this.prisma.experienceRequest.create({
      data: {
        bookingId,
        catalogItemId: dto.catalogItemId,
        requestedByEmail: requestedBy.email,
        requestedByName: requestedBy.name,
        guestTier: isSecondary ? 'SECONDARY' : 'PRIMARY',
        preferredDate: new Date(dto.preferredDate),
        preferredTime: dto.preferredTime,
        guestCount: dto.guestCount,
        specialRequests: dto.specialRequests,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        transportPreference: dto.transportPreference,
        status: 'PENDING',
        requiresPrimaryApproval,
        primaryApproved: !requiresPrimaryApproval, // auto-approved if primary member
        estimatedMin: estimate?.min ?? null,
        estimatedMax: estimate?.max ?? null,
        priceUnitCode: estimate?.unitCode ?? null,
      },
      include: { catalogItem: { include: { priceUnit: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_REQUESTED',
        entityType: 'ExperienceRequest',
        entityId: request.id,
        performedBy: requestedBy.email,
        performedByRole: requestedBy.tier,
        bookingId,
        metadata: {
          catalogItemName: catalogItem.name,
          requiresPrimaryApproval,
        } as any,
      },
    });

    if (requiresPrimaryApproval) {
      // Notify PRIMARY MEMBER to approve first — not Rodrigo
      await this.notificationsService.send({
        bookingId,
        recipientEmail: booking.primaryGuest.email,
        type: 'REQUEST_CONFIRMED',
        title: 'Guest upgrade request',
        body: `${requestedBy.name} has requested ${catalogItem.name} — tap to approve or decline`,
        deepLink: `/approvals`,
      });

      await this.pusherService.secondaryRequestPending(bookingId, {
        requestId: request.id,
        guestName: requestedBy.name,
        experienceName: catalogItem.name,
        preferredDate: dto.preferredDate,
        preferredTime: dto.preferredTime,
        guestCount: dto.guestCount,
      });
    } else {
      // Primary member request or included service — goes straight to Rodrigo
      const emPayload = {
        requestId: request.id,
        guestName: requestedBy.name,
        experienceName: catalogItem.name,
        preferredDate: dto.preferredDate,
      };
      // When primary member request — notify EM:
      await this.pusherService.newRequestToEm({
        requestId: request.id,
        guestName: requestedBy.name,
        experienceName: catalogItem.name,
        preferredDate: dto.preferredDate,
        preferredTime: dto.preferredTime,
        bookingId,
        isPrimaryApproved: true,
      });
    }

    return request;
  }

  // ─── Primary member approves a secondary guest upgrade request ────────────

  async primaryApprove(
    requestId: string,
    approvedBy: string,
    bookingId: string,
  ) {
    const request = await this.findOne(requestId);

    // Validate: only the primary member of this booking can approve
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.primaryGuest.email !== approvedBy) {
      throw new ForbiddenException(
        'Only the primary member can approve upgrade requests',
      );
    }

    if (!request.requiresPrimaryApproval) {
      throw new BadRequestException(
        'This request does not require primary member approval',
      );
    }

    if (request.primaryApproved) {
      throw new BadRequestException(
        'Request already approved by primary member',
      );
    }

    const updated = await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        primaryApproved: true,
        primaryApprovedAt: new Date(),
        primaryApprovedBy: approvedBy,
      },
      include: { catalogItem: { include: { priceUnit: true } } },
    });

    // Now notify Rodrigo — the request enters his queue
    await this.pusherService.newRequestToEm({
      requestId,
      guestName: request.requestedByName,
      experienceName: request.catalogItem.name,
      preferredDate: request.preferredDate.toISOString(),
      preferredTime: request.preferredTime,
      bookingId,
      isPrimaryApproved: true,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_CONFIRMED',
        entityType: 'ExperienceRequest',
        entityId: requestId,
        performedBy: approvedBy,
        performedByRole: 'primary_member',
        bookingId,
        metadata: { action: 'primary_approved' } as any,
      },
    });

    this.logger.log(
      `Request ${requestId} approved by primary member ${approvedBy}`,
    );
    return updated;
  }

  // ─── Primary member declines a secondary guest upgrade request ────────────

  async primaryDecline(
    requestId: string,
    declinedBy: string,
    bookingId: string,
    reason?: string,
  ) {
    const request = await this.findOne(requestId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });

    if (booking?.primaryGuest.email !== declinedBy) {
      throw new ForbiddenException(
        'Only the primary member can decline upgrade requests',
      );
    }

    const updated = await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: new Date(),
        declineReason: reason || 'Declined by primary member',
      },
    });

    // Notify secondary guest
    await this.notificationsService.send({
      bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CANCELLED',
      title: 'Request update',
      body: `Your request for ${request.catalogItem.name} was not approved`,
      deepLink: `/status/${requestId}`,
    });

    await this.pusherService.experienceStatusChanged(bookingId, {
      requestId,
      status: 'CANCELLED',
    });

    return updated;
  }

  // ─── Get pending requests that need primary member approval ───────────────

  async getPendingPrimaryApproval(bookingId: string) {
    return this.prisma.experienceRequest.findMany({
      where: {
        bookingId,
        requiresPrimaryApproval: true,
        primaryApproved: false,
        status: 'PENDING',
      },
      include: {
        catalogItem: { include: { priceUnit: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── All other methods remain the same as before ──────────────────────────

  async findByBooking(
    bookingId: string,
    filter?: 'active' | 'all' | 'today',
    requestedByEmail?: string,
  ) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const where: any = { bookingId };

    // Scope to the requesting guest's OWN experiences — each guest's Status /
    // Orders shows only what they requested, never the rest of the party's.
    if (requestedByEmail) {
      where.requestedByEmail = {
        equals: requestedByEmail,
        mode: 'insensitive',
      };
    }

    if (filter === 'active') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY'] };
    } else if (filter === 'today') {
      where.preferredDate = { gte: todayStart, lt: todayEnd };
    }

    const requests = await this.prisma.experienceRequest.findMany({
      where,
      include: {
        catalogItem: {
          include: {
            vendor: {
              select: { name: true, role: true, photoUrl: true },
            },
          },
        },
      },
    });

    const statusOrder: Record<string, number> = {
      READY: 0,
      IN_PROGRESS: 1,
      CONFIRMED: 2,
      PENDING: 3,
      COMPLETED: 4,
      CANCELLED: 5,
    };

    return requests.sort(
      (a: { status: string | number }, b: { status: string | number }) =>
        (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
    );
  }

  async findOne(id: string) {
    const request = await this.prisma.experienceRequest.findUnique({
      where: { id },
      include: {
        catalogItem: { include: { vendor: true } },
        folioItem: true,
        vendorRating: true,
      },
    });
    if (!request) throw new NotFoundException(`Request ${id} not found`);
    return request;
  }

  async getQueue() {
    const requests = await this.prisma.experienceRequest.findMany({
      where: {
        status: { in: ['PENDING', 'CONFLICT'] },
        primaryApproved: true,
      },
      include: {
        catalogItem: { include: { vendor: true } },
        booking: {
          include: {
            primaryGuest: true,
            manifestGuests: {
              select: { email: true, roomNumber: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Ordered by when the experience HAPPENS, not when it was asked for.
    // Guests now plan months ahead, so submission order put a request made in
    // August for a November stay above one made yesterday for tomorrow —
    // exactly backwards for someone working through a queue.
    requests.sort(
      (a, b) =>
        (a.confirmedDate ?? a.preferredDate).getTime() -
        (b.confirmedDate ?? b.preferredDate).getTime(),
    );

    return requests.map((request) => ({
      ...request,
      booking: request.booking
        ? {
            ...request.booking,
            primaryRoomNumber: derivePrimaryRoomNumber(
              request.booking.manifestGuests,
              request.booking.primaryGuest.email,
            ),
          }
        : request.booking,
    }));
  }

  // Resolved requests (declined / completed) so the EM can keep track —
  // includes primary-declined requests with the reason the primary gave.
  async getHistory() {
    return this.prisma.experienceRequest.findMany({
      where: { status: { in: ['COMPLETED', 'CANCELLED'] } },
      include: {
        catalogItem: { include: { vendor: true } },
        booking: { include: { primaryGuest: true } },
      },
      orderBy: { statusUpdatedAt: 'desc' },
      take: 100,
    });
  }

  async getActive() {
    return this.prisma.experienceRequest.findMany({
      where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] } },
      include: {
        catalogItem: { include: { priceUnit: true } },
        booking: { include: { primaryGuest: true } },
      },
      orderBy: { preferredDate: 'asc' },
    });
  }

  async getTodaySchedule() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.experienceRequest.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY'] },
        OR: [
          { confirmedDate: { gte: todayStart, lt: todayEnd } },
          {
            confirmedDate: null,
            preferredDate: { gte: todayStart, lt: todayEnd },
          },
        ],
      },
      include: {
        catalogItem: { include: { vendor: true } },
        booking: { include: { primaryGuest: true } },
      },
      orderBy: [{ preferredTime: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async approve(id: string, dto: ConfirmRequestDto, approvedBy: string) {
    const request = await this.findOne(id);

    // A conflicted request can be re-confirmed once the clash is resolved.
    if (request.status !== 'PENDING' && request.status !== 'CONFLICT') {
      throw new BadRequestException(
        'Only pending or conflicted requests can be confirmed',
      );
    }

    if (request.requiresPrimaryApproval && !request.primaryApproved) {
      throw new BadRequestException(
        'This request requires primary member approval first',
      );
    }

    const confirmedDate = dto.confirmedDate
      ? new Date(dto.confirmedDate)
      : request.preferredDate;
    const confirmedTime = dto.confirmedTime || request.preferredTime;

    // Conflict engine — if the resource (vendor, else the item itself) is
    // already committed for an overlapping window, hold the request in CONFLICT
    // instead of confirming. The EM resolves by rescheduling or declining, then
    // re-confirms. No Breezeway task and no guest "confirmed" notice until clear.
    const conflict = await this.conflictService.findResourceConflict({
      requestId: id,
      catalogItemId: request.catalogItemId,
      vendorId: request.catalogItem.vendorId ?? null,
      date: confirmedDate,
      time: confirmedTime,
      durationMin: request.catalogItem.durationMinutes ?? null,
    });

    if (conflict) {
      const flagged = await this.prisma.experienceRequest.update({
        where: { id },
        data: {
          status: 'CONFLICT',
          statusUpdatedAt: new Date(),
          confirmedDate,
          confirmedTime,
          emNotes: dto.emNotes,
          conflictReason: conflict.reason,
        },
        include: {
          catalogItem: { include: { priceUnit: true } },
          booking: { include: { primaryGuest: true } },
        },
      });

      const remainingCount = await this.prisma.experienceRequest.count({
        where: {
          status: { in: ['PENDING', 'CONFLICT'] },
          primaryApproved: true,
        },
      });
      await this.pusherService.requestResolvedToEm({
        requestId: id,
        action: 'conflict',
        remainingPendingCount: remainingCount,
      });

      // The conflict is recorded on the request itself (status + conflictReason
      // + statusUpdatedAt); no dedicated AuditAction enum value for it.
      return flagged;
    }

    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        statusUpdatedAt: new Date(),
        confirmedDate,
        confirmedTime,
        emNotes: dto.emNotes,
        conflictReason: null,
      },
      include: {
        catalogItem: { include: { priceUnit: true } },
        booking: { include: { primaryGuest: true } },
      },
    });

    // Only complimentary experiences get their setup task at confirm time. A
    // priced one waits until its cost is agreed — otherwise a vendor is booked
    // for something the primary might still decline, and there is no way to
    // unwind a Breezeway task once it exists.
    if (updated.catalogItem.isIncluded && isWithinTaskWindow(confirmedDate)) {
      await this.createBreezeWayTask(updated);
    }

    await this.notificationsService.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CONFIRMED',
      title: 'Experience confirmed',
      body: `${request.catalogItem.name} confirmed for ${updated.confirmedTime}`,
      deepLink: `/status/${id}`,
    });

    await this.pusherService.experienceStatusChanged(request.bookingId, {
      requestId: id,
      status: 'CONFIRMED',
    });

    // Notify EM that request is resolved:
    const remainingCount = await this.prisma.experienceRequest.count({
      where: {
        status: { in: ['PENDING', 'CONFLICT'] },
        primaryApproved: true,
      },
    });
    await this.pusherService.requestResolvedToEm({
      requestId: id,
      action: 'approved',
      remainingPendingCount: remainingCount,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_CONFIRMED',
        entityType: 'ExperienceRequest',
        entityId: id,
        performedBy: approvedBy,
        performedByRole: 'estate_manager',
        bookingId: request.bookingId,
      },
    });

    return updated;
  }

  async decline(id: string, dto: DeclineRequestDto, declinedBy: string) {
    const request = await this.findOne(id);

    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: new Date(),
        declineReason: dto.declineReason,
      },
    });

    await this.notificationsService.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CANCELLED',
      title: 'Request update',
      body:
        dto.declineReason || `Unable to confirm ${request.catalogItem.name}`,
      deepLink: `/status/${id}`,
    });

    await this.pusherService.experienceStatusChanged(request.bookingId, {
      requestId: id,
      status: 'CANCELLED',
    });

    return updated;
  }

  async confirmCost(
    id: string,
    data: { confirmedCost: number; emNotes?: string },
    confirmedBy: string,
  ) {
    const request = await this.findOne(id);

    // Measure against whatever the guest last agreed to — not always the
    // estimate. Once a price has been confirmed, THAT is what they consented to,
    // and a later revision has to be judged against it. Comparing a revision to
    // the original estimate let a firm $1,000 be raised to $1,400 unchallenged,
    // because it still sat inside tolerance of the estimate's ceiling.
    const agreedBaseline =
      toNumber(request.confirmedCost) ?? toNumber(request.estimatedMax);
    if (quoteNeedsReapproval(data.confirmedCost, agreedBaseline)) {
      return this.parkQuoteForReapproval(id, data, confirmedBy, agreedBaseline!);
    }

    await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        confirmedCost: data.confirmedCost,
        emNotes: data.emNotes,
        quotedCost: data.confirmedCost,
        quoteApprovalRequired: false,
      },
    });

    return this.postConfirmedCost(id, data.confirmedCost, confirmedBy);
  }

  /**
   * Hold a quote that exceeds the approved estimate. No folio item is created —
   * nothing is charged until the primary confirms the revised figure.
   */
  private async parkQuoteForReapproval(
    id: string,
    data: { confirmedCost: number; emNotes?: string },
    quotedBy: string,
    /** What the guest last agreed to — an estimate, or a price already set. */
    agreedBaseline: number,
  ) {
    const request = await this.findOne(id);
    // Wording has to follow which of the two it was, or a guest who agreed a
    // firm price is told their "estimate" changed.
    const baselineLabel = request.confirmedCost
      ? 'the price you approved'
      : 'the estimate';

    await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        quotedCost: data.confirmedCost,
        quoteApprovalRequired: true,
        quoteApprovedAt: null,
        quoteApprovedBy: null,
        emNotes: data.emNotes,
      },
    });

    const booking = await this.prisma.booking.findUnique({
      where: { id: request.bookingId },
      include: { primaryGuest: true },
    });

    if (booking) {
      await this.notificationsService.send({
        bookingId: request.bookingId,
        recipientEmail: booking.primaryGuest.email,
        type: 'REQUEST_CONFIRMED',
        title: 'Revised quote needs your approval',
        body: `${request.catalogItem.name} is quoted at ${formatPrice(
          data.confirmedCost,
        )}, above ${baselineLabel} of ${formatPrice(
          agreedBaseline,
        )} — tap to approve.`,
        deepLink: '/approvals',
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_CONFIRMED',
        entityType: 'ExperienceRequest',
        entityId: id,
        performedBy: quotedBy,
        performedByRole: 'estate_manager',
        bookingId: request.bookingId,
        metadata: {
          action: 'quote_awaiting_reapproval',
          quotedCost: data.confirmedCost,
          agreedBaseline,
        } as any,
      },
    });

    this.logger.log(
      `Quote ${formatPrice(data.confirmedCost)} on request ${id} exceeds ${baselineLabel} of ${formatPrice(agreedBaseline)} — awaiting primary re-approval`,
    );

    return {
      success: true,
      quoteApprovalRequired: true,
      quotedCost: data.confirmedCost,
      agreedBaseline,
    };
  }

  /**
   * The primary confirms a revised quote that came in above their approved
   * estimate. Only now does the charge reach the folio.
   */
  async approveQuote(requestId: string, approvedBy: string, bookingId: string) {
    const request = await this.findOne(requestId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.primaryGuest.email !== approvedBy) {
      throw new ForbiddenException(
        'Only the primary member can approve a revised quote',
      );
    }
    if (!request.quoteApprovalRequired) {
      throw new BadRequestException(
        'This request has no revised quote awaiting approval',
      );
    }

    const quoted = toNumber(request.quotedCost);
    if (quoted == null) {
      throw new BadRequestException('No quote recorded for this request');
    }

    await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        confirmedCost: quoted,
        quoteApprovalRequired: false,
        quoteApprovedAt: new Date(),
        quoteApprovedBy: approvedBy,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_CONFIRMED',
        entityType: 'ExperienceRequest',
        entityId: requestId,
        performedBy: approvedBy,
        performedByRole: 'primary_member',
        bookingId,
        metadata: { action: 'quote_approved', quotedCost: quoted } as any,
      },
    });

    return this.postConfirmedCost(requestId, quoted, approvedBy);
  }

  /**
   * The primary rejects the revised quote — the experience is cancelled and
   * nothing reaches the folio.
   */
  async declineQuote(
    requestId: string,
    declinedBy: string,
    bookingId: string,
    reason?: string,
  ) {
    const request = await this.findOne(requestId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (booking?.primaryGuest.email !== declinedBy) {
      throw new ForbiddenException(
        'Only the primary member can decline a revised quote',
      );
    }
    if (!request.quoteApprovalRequired) {
      throw new BadRequestException(
        'This request has no revised quote awaiting approval',
      );
    }

    // Take the charge back off.
    //
    // The experience was confirmed at the ORIGINAL price, so a folio item
    // already exists. Ending the request without removing it billed the guest
    // for the old figure on something nobody was going to deliver — they
    // declined precisely to avoid being charged. No fee applies either: they
    // refused before the estate committed to the new price.
    if (request.folioItemId) {
      await this.prisma.folioItem
        .delete({ where: { id: request.folioItemId } })
        .catch(() => undefined);
    }

    const updated = await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: new Date(),
        quoteApprovalRequired: false,
        folioItemId: null,
        declineReason: reason || 'Revised quote declined by primary member',
      },
    });

    if (request.folioItemId) {
      await this.pusherService.folioUpdated(bookingId, {
        removedItemId: request.folioItemId,
      });
    }

    await this.notificationsService.send({
      bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CANCELLED',
      title: 'Request update',
      body: `${request.catalogItem.name} was not booked — the final quote wasn't approved, and the charge has come off your folio`,
      deepLink: `/status/${requestId}`,
    });

    await this.pusherService.experienceStatusChanged(bookingId, {
      requestId,
      status: 'CANCELLED',
    });

    // Rodrigo quoted this and needs telling it was rejected — the experience
    // was already confirmed, so there is a Breezeway setup task and very likely
    // a vendor booked against it. Without this he finds out when staff turn up.
    await this.prisma.systemAlert.create({
      data: {
        severity: 'WARNING',
        title: 'Revised quote declined',
        message: `${request.requestedByName}'s ${request.catalogItem.name} was cancelled — the primary member declined the ${formatPrice(
          toNumber(request.quotedCost) ?? 0,
        )} quote. No charge was raised and no setup task was created.`,
        category: 'BOOKING',
        entityType: 'ExperienceRequest',
        entityId: requestId,
      },
    });

    return updated;
  }

  // ─── Guest cancels — two different acts behind one intention ─────────────

  /**
   * Before the estate confirms, nothing is committed: the request is simply
   * withdrawn. Afterwards a vendor is booked, so the guest can only ASK, and
   * Rodrigo unwinds it — possibly at a cost.
   *
   * The requester may cancel their own; the primary may cancel anyone's, since
   * every charge on the booking lands on them.
   */
  async guestCancel(
    requestId: string,
    actorEmail: string,
    bookingId: string,
    reason?: string,
  ) {
    const request = await this.findOne(requestId);

    if (request.bookingId !== bookingId) {
      throw new ForbiddenException('That request belongs to another booking');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isPrimary =
      booking.primaryGuest.email.toLowerCase() === actorEmail.toLowerCase();
    const isRequester =
      request.requestedByEmail.toLowerCase() === actorEmail.toLowerCase();
    if (!isPrimary && !isRequester) {
      throw new ForbiddenException(
        'Only the guest who requested this, or the primary member, can cancel it',
      );
    }

    if (request.status === 'CANCELLED') {
      throw new BadRequestException('This experience is already cancelled');
    }
    if (request.status === 'COMPLETED') {
      throw new BadRequestException(
        'This experience has already taken place and cannot be cancelled',
      );
    }
    if (request.cancellationRequestedAt) {
      throw new BadRequestException(
        'A cancellation has already been requested for this experience',
      );
    }

    // Nothing committed yet — withdraw it outright.
    if (request.status === 'PENDING' || request.status === 'CONFLICT') {
      const withdrawn = await this.prisma.experienceRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
          statusUpdatedAt: new Date(),
          declineReason: reason || 'Withdrawn by the guest',
          cancellationRequestedAt: new Date(),
          cancellationRequestedBy: actorEmail,
          cancellationReason: reason,
        },
      });

      await this.pusherService.experienceStatusChanged(bookingId, {
        requestId,
        status: 'CANCELLED',
      });

      this.logger.log(`Request ${requestId} withdrawn by ${actorEmail}`);
      return { ...withdrawn, withdrawn: true };
    }

    // Confirmed or later — a vendor is involved, so this is a request, not an act.
    const pending = await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        cancellationRequestedAt: new Date(),
        cancellationRequestedBy: actorEmail,
        cancellationReason: reason,
      },
    });

    await this.prisma.systemAlert.create({
      data: {
        severity: 'WARNING',
        title: 'Cancellation requested',
        message: `${request.requestedByName} asked to cancel ${request.catalogItem.name}${
          request.confirmedDate
            ? ` on ${request.confirmedDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              })}`
            : ''
        }${reason ? ` — “${reason}”` : ''}. Unwind it with the vendor, then confirm the cancellation and record any fee.`,
        category: 'BOOKING',
        entityType: 'ExperienceRequest',
        entityId: requestId,
      },
    });

    this.logger.log(
      `Cancellation requested on ${requestId} by ${actorEmail} — awaiting the estate`,
    );
    return { ...pending, withdrawn: false };
  }

  /** Requests where a guest has asked to cancel something already confirmed. */
  async getCancellationRequests() {
    return this.prisma.experienceRequest.findMany({
      where: {
        cancellationRequestedAt: { not: null },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      include: {
        catalogItem: { include: { priceUnit: true } },
        booking: { include: { primaryGuest: true } },
      },
      orderBy: { confirmedDate: 'asc' },
    });
  }

  /**
   * Rodrigo unwinds a confirmed experience the guest asked to drop.
   *
   * Any charge already on the folio is removed — they are not having the
   * experience — and replaced by the vendor's cancellation fee if there was
   * one. Recorded as an incidental against the guest who asked, so it shows in
   * the by-guest breakdown and the primary can settle it with them.
   */
  async confirmCancellation(
    requestId: string,
    confirmedBy: string,
    cancellationFee?: number,
  ) {
    const request = await this.findOne(requestId);

    if (!request.cancellationRequestedAt) {
      throw new BadRequestException(
        'No cancellation has been requested for this experience',
      );
    }

    if (request.folioItemId) {
      await this.prisma.folioItem.delete({
        where: { id: request.folioItemId },
      });
      // Same reason as the quote-decline path: a folio left open would keep
      // showing a charge that no longer exists.
      await this.pusherService.folioUpdated(request.bookingId, {
        removedItemId: request.folioItemId,
      });
    }

    const fee = cancellationFee && cancellationFee > 0 ? cancellationFee : null;
    if (fee) {
      await this.prisma.folioItem.create({
        data: {
          bookingId: request.bookingId,
          type: 'INCIDENTAL',
          description: `Cancellation fee — ${request.catalogItem.name}`,
          amount: fee,
          quantity: 1,
          attributedToEmail: request.requestedByEmail,
          attributedToName: request.requestedByName,
          loggedBy: confirmedBy,
          loggedAt: new Date(),
          editableUntil: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
    }

    const cancelled = await this.prisma.experienceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        statusUpdatedAt: new Date(),
        cancellationFee: fee,
        folioItemId: null,
        confirmedCost: null,
        declineReason:
          request.cancellationReason || 'Cancelled at the guest’s request',
      },
    });

    await this.notificationsService.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'REQUEST_CANCELLED',
      title: 'Experience cancelled',
      body: fee
        ? `${request.catalogItem.name} is cancelled. The vendor charged a ${formatPrice(fee)} cancellation fee, which is on your folio.`
        : `${request.catalogItem.name} is cancelled — no charge.`,
      deepLink: `/status/${requestId}`,
    });

    await this.pusherService.experienceStatusChanged(request.bookingId, {
      requestId,
      status: 'CANCELLED',
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'EXPERIENCE_CANCELLED',
        entityType: 'ExperienceRequest',
        entityId: requestId,
        performedBy: confirmedBy,
        performedByRole: 'estate_manager',
        bookingId: request.bookingId,
        metadata: {
          action: 'guest_cancellation_confirmed',
          requestedBy: request.cancellationRequestedBy,
          cancellationFee: fee,
        } as any,
      },
    });

    return cancelled;
  }

  /**
   * What Rodrigo has to put a price on, soonest first.
   *
   * Pricing moved to whenever the supplier commits, which means the work is
   * scheduled by the experience's own date rather than by when the guest asked.
   * Nothing else in the dashboard answers "what must I price this week?".
   *
   * Complimentary experiences are excluded — they never carry a price — as is
   * anything a guest has asked to cancel.
   */
  async getNeedsPricing(withinDays = 14) {
    const horizon = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);

    return this.prisma.experienceRequest.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] },
        confirmedCost: null,
        cancellationRequestedAt: null,
        confirmedDate: { not: null, lte: horizon },
        catalogItem: { isIncluded: false },
      },
      include: {
        catalogItem: { include: { priceUnit: true } },
        booking: { include: { primaryGuest: true } },
      },
      orderBy: { confirmedDate: 'asc' },
    });
  }

  /** Requests holding a revised quote the primary still needs to act on. */
  async getPendingQuoteApproval(bookingId: string) {
    return this.prisma.experienceRequest.findMany({
      where: {
        bookingId,
        quoteApprovalRequired: true,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      include: { catalogItem: { include: { priceUnit: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Folio item + realtime + primary notification, once a cost is agreed. */
  private async postConfirmedCost(
    id: string,
    confirmedCost: number,
    loggedBy: string,
  ) {
    const request = await this.findOne(id);

    // The price is settled, so the estate can commit staff to it. Both routes
    // here — a quote inside tolerance, and one the primary re-approved — land
    // in this method, so this is the only place the task needs creating.
    //
    // Skipped when a task already exists (the cost can be edited and re-logged,
    // which would otherwise duplicate it in Breezeway) and when the request
    // isn't confirmed, since the due date is derived from confirmedDate.
    // Held back until the experience is near. A price agreed weeks early would
    // otherwise put a task in front of staff a month before they can act on it;
    // the scheduler creates it when the date comes round.
    if (
      !request.catalogItem.isIncluded &&
      !request.breezeWayTaskId &&
      isWithinTaskWindow(request.confirmedDate)
    ) {
      await this.createBreezeWayTask(request);
    }

    // A price can be agreed once and revised later — a vendor booked in August
    // for a September experience has weeks to change its mind. Raising a second
    // folio item would bill the guest for both, so an existing charge is
    // updated in place instead.
    const editableUntil = new Date(Date.now() + 30 * 60 * 1000);
    const isRevision = !!request.folioItemId;

    const folio = isRevision
      ? await this.prisma.folioItem.update({
          where: { id: request.folioItemId! },
          data: {
            amount: confirmedCost,
            loggedBy,
            loggedAt: new Date(),
            editableUntil,
          },
        })
      : await this.prisma.folioItem.create({
          data: {
            bookingId: request.bookingId,
            type: 'EXPERIENCE',
            description: request.catalogItem.name,
            amount: confirmedCost,
            quantity: 1,
            // The requester carries the charge — this is what lets the primary
            // see what each guest spent and settle up independently.
            attributedToEmail: request.requestedByEmail,
            attributedToName: request.requestedByName,
            loggedBy,
            loggedAt: new Date(),
            editableUntil,
            experienceRequest: {
              connect: { id },
            },
          },
        });

    if (!isRevision) {
      await this.prisma.experienceRequest.update({
        where: { id },
        data: { folioItemId: folio.id },
      });
    }

    await this.pusherService.folioUpdated(request.bookingId, {
      newItem: {
        id: folio.id,
        description: request.catalogItem.name,
        amount: confirmedCost,
        quantity: 1,
        total: confirmedCost,
        type: 'EXPERIENCE',
      },
    });

    // Notify PRIMARY member only — secondary guests never see cost
    const booking = await this.prisma.booking.findUnique({
      where: { id: request.bookingId },
      include: { primaryGuest: true },
    });

    if (booking) {
      await this.notificationsService.send({
        bookingId: request.bookingId,
        recipientEmail: booking.primaryGuest.email,
        type: 'CHARGE_ADDED',
        title: isRevision ? 'Folio charge revised' : 'Charge added to folio',
        body: `${request.catalogItem.name} — ${formatPrice(confirmedCost)}`,
        deepLink: '/folio',
      });
    }

    return { success: true };
  }

  async markReady(id: string, photoUrl?: string, staffName?: string) {
    const request = await this.findOne(id);

    const updated = await this.prisma.experienceRequest.update({
      where: { id },
      data: {
        status: 'READY',
        statusUpdatedAt: new Date(),
        setupPhotoUrl: photoUrl,
        setupCompletedAt: new Date(),
        staffMemberName: staffName,
      },
      include: { catalogItem: { include: { priceUnit: true } } },
    });

    await this.notificationsService.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: 'EXPERIENCE_READY',
      title: `${request.catalogItem.name} is ready`,
      body: 'Your experience is ready — head over now.',
      deepLink: `/status/${id}`,
    });

    await this.pusherService.experienceReady(request.bookingId, {
      requestId: id,
      experienceName: request.catalogItem.name,
      photoUrl,
    });

    return updated;
  }

  async markCompleted(id: string) {
    return this.prisma.experienceRequest.update({
      where: { id },
      data: { status: 'COMPLETED', statusUpdatedAt: new Date() },
    });
  }

  async findByBreezeWayTaskId(taskId: string) {
    return this.prisma.experienceRequest.findUnique({
      where: { breezeWayTaskId: taskId },
      include: { catalogItem: { include: { priceUnit: true } } },
    });
  }

  /**
   * Scheduler entry point — creates a setup task for an experience that has come
   * within its window. Re-reads the request so a task raised in the meantime,
   * or a cancellation, is respected.
   */
  async createDueBreezeWayTask(id: string) {
    const request = await this.findOne(id);
    if (request.breezeWayTaskId || request.cancellationRequestedAt) return;
    if (!request.confirmedDate) return;
    await this.createBreezeWayTask(request);
  }

  private async createBreezeWayTask(request: any) {
    const category = request.catalogItem.category;
    // catalogItem.breezeWayTeamId is a per-item override; it now holds a person
    // id (the DB column keeps its legacy name to avoid a migration).
    const assigneeId =
      request.catalogItem.breezeWayTeamId ||
      BREEZEWAY_ASSIGNEE_MAP[category] ||
      BREEZEWAY_ASSIGNEE_MAP['WELLNESS'];

    const leadTime =
      request.catalogItem.setupLeadTimeMinutes ||
      EXPERIENCE_LEAD_TIMES[category] ||
      60;

    const dueDate = new Date(request.confirmedDate);
    dueDate.setMinutes(dueDate.getMinutes() - leadTime);

    try {
      const task = await this.breezeWayService.createTask({
        title: `${request.catalogItem.name} — Setup`,
        description: `Guest: ${request.requestedByName}\nTime: ${request.confirmedTime}\nGuests: ${request.guestCount}\nNotes: ${request.specialRequests || 'None'}`,
        propertyId: process.env.BREEZEWAY_PROPERTY_ID || '',
        assigneeId,
        dueDate: dueDate.toISOString(),
        requirePhoto: true,
        templateId: request.catalogItem.breezeWayTemplateId,
        metadata: { requestId: request.id, bookingId: request.bookingId },
      });

      // Breezeway returns the task id as a NUMBER; breezeWayTaskId is a string
      // column, so coerce it — otherwise the update throws and the request is
      // wrongly left at CONFIRMED even though the task was created.
      const taskId = task?.id ?? task?.data?.id ?? null;

      await this.prisma.experienceRequest.update({
        where: { id: request.id },
        data: {
          breezeWayTaskId: taskId != null ? String(taskId) : undefined,
          breezeWayTaskCreatedAt: new Date(),
          status: 'IN_PROGRESS',
        },
      });
    } catch (error) {
      this.logger.error(`Breezeway task failed: ${getErrorMessage(error)}`);
      // Don't let the failure stay silent — the request is confirmed but has no
      // setup task, so raise an EM alert (surfaces in the bell + notifications).
      await this.prisma.systemAlert
        .create({
          data: {
            severity: 'warning',
            title: 'Breezeway task not created',
            message: `Setup task for "${request.catalogItem.name}" (${request.requestedByName}) couldn't be created in Breezeway. The experience is confirmed but has no setup task — check the Breezeway integration.`,
            category: 'integration',
            entityType: 'ExperienceRequest',
            entityId: request.id,
          },
        })
        .catch(() => undefined);
    }
  }
}
