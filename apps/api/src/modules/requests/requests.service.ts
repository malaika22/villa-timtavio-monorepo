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
} from '../breezeway/breezeway.config';
import { derivePrimaryRoomNumber } from '../../common/booking-room.util';
import { getErrorMessage } from '../../commons/utils/error.util';
import { PrismaService } from '../../prisma/prisma.service';

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
    });
    if (!catalogItem) throw new NotFoundException('Experience not found');
    if (!catalogItem.isActive) {
      throw new BadRequestException('Experience is not available');
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
      },
      include: { catalogItem: true },
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
      include: { catalogItem: true },
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
        catalogItem: true,
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
        catalogItem: true,
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
          catalogItem: true,
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
        catalogItem: true,
        booking: { include: { primaryGuest: true } },
      },
    });

    await this.createBreezeWayTask(updated);

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

    await this.prisma.experienceRequest.update({
      where: { id },
      data: { confirmedCost: data.confirmedCost, emNotes: data.emNotes },
    });

    const folio = await this.prisma.folioItem.create({
      data: {
        bookingId: request.bookingId,
        type: 'EXPERIENCE',
        description: request.catalogItem.name,
        amount: data.confirmedCost,
        quantity: 1,
        attributedToEmail: request.requestedByEmail,
        attributedToName: request.requestedByName,
        loggedBy: confirmedBy,
        loggedAt: new Date(),
        editableUntil: new Date(Date.now() + 30 * 60 * 1000),
        experienceRequest: {
          connect: { id },
        },
      },
    });

    await this.prisma.experienceRequest.update({
      where: { id },
      data: { folioItemId: folio.id },
    });

    await this.pusherService.folioUpdated(request.bookingId, {
      newItem: {
        id: folio.id,
        description: request.catalogItem.name,
        amount: Number(data.confirmedCost),
        quantity: 1,
        total: Number(data.confirmedCost),
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
        title: 'Charge added to folio',
        body: `${request.catalogItem.name} — $${data.confirmedCost}`,
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
      include: { catalogItem: true },
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
      include: { catalogItem: true },
    });
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

      await this.prisma.experienceRequest.update({
        where: { id: request.id },
        data: {
          breezeWayTaskId: task.id,
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
