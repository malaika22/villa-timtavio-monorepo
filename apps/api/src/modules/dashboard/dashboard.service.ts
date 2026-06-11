import { Injectable } from '@nestjs/common';
import { ScheduleItemType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(
      todayStart.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const lastWeekEnd = new Date(
      lastWeekStart.getTime() + 24 * 60 * 60 * 1000,
    );

    const [
      guestsInHouse,
      arrivingToday,
      activeExperiences,
      afternoonExperiences,
      pendingApprovals,
      revenueToday,
      revenueLastWeek,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          status: { in: ['CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'] },
        },
      }),

      this.prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          checkIn: { gte: todayStart, lt: todayEnd },
        },
      }),

      this.prisma.experienceRequest.count({
        where: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] },
        },
      }),

      this.prisma.experienceRequest.count({
        where: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          preferredDate: { gte: todayStart, lt: todayEnd },
          preferredTime: { contains: 'PM' },
        },
      }),

      this.prisma.experienceRequest.count({
        where: {
          status: 'PENDING',
          primaryApproved: true,
        },
      }),

      this.prisma.folioItem.aggregate({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
          type: { not: 'ESTATE_BASE_RATE' },
        },
        _sum: { amount: true },
      }),

      this.prisma.folioItem.aggregate({
        where: {
          createdAt: { gte: lastWeekStart, lt: lastWeekEnd },
          type: { not: 'ESTATE_BASE_RATE' },
        },
        _sum: { amount: true },
      }),
    ]);

    const todayRev = Number(revenueToday._sum.amount || 0);
    const lastWeekRev = Number(revenueLastWeek._sum.amount || 0);
    const revChange =
      lastWeekRev > 0
        ? Math.round(((todayRev - lastWeekRev) / lastWeekRev) * 100)
        : 0;

    return {
      guestsInHouse,
      arrivingToday,
      activeExperiences,
      afternoonExperiences,
      pendingApprovals,
      revenueToday: todayRev,
      revenueVsLastWeek: revChange,
    };
  }

  async getAlertBanner() {
    const [alerts, pendingCount, inquiryCount, conflictCount] =
      await Promise.all([
        this.prisma.systemAlert.findMany({
          where: { category: 'BOOKING', isDismissed: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        this.prisma.experienceRequest.count({
          where: { status: 'PENDING', primaryApproved: true },
        }),
        this.prisma.inquiry.count({
          where: { status: 'NEW' },
        }),
        this.prisma.experienceRequest.count({
          where: { status: 'CONFLICT', primaryApproved: true },
        }),
      ]);

    const conflictRequest = await this.prisma.experienceRequest.findFirst({
      where: { status: 'CONFLICT', primaryApproved: true },
      include: { catalogItem: true },
      orderBy: { createdAt: 'desc' },
    });

    const conflictMessage = conflictRequest
      ? `${conflictRequest.catalogItem.name} conflicts with an existing booking`
      : conflictCount > 0
        ? `${conflictCount} experience request${conflictCount === 1 ? '' : 's'} in conflict`
        : null;

    const parts: string[] = [];

    if (pendingCount > 0) {
      parts.push(
        `${pendingCount} approval${pendingCount === 1 ? '' : 's'} require${pendingCount === 1 ? 's' : ''} attention`,
      );
    }

    if (conflictMessage) {
      parts.push(conflictMessage);
    }

    if (inquiryCount > 0) {
      parts.push(
        `${inquiryCount} inquir${inquiryCount === 1 ? 'y' : 'ies'} need${inquiryCount === 1 ? 's' : ''} review`,
      );
    }

    if (parts.length === 0 && alerts.length > 0) {
      parts.push(...alerts.map((a) => a.message || a.title));
    }

    const reviewHref =
      inquiryCount > 0 && pendingCount === 0
        ? '/inquiries'
        : '/approvals';

    return {
      message: parts.length > 0 ? parts.join(' · ') : null,
      pendingApprovals: pendingCount,
      pendingInquiries: inquiryCount,
      conflictMessage,
      reviewHref,
      alerts,
    };
  }

  async getTodaySchedule() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const experienceRequests = await this.prisma.experienceRequest.findMany({
      where: {
        preferredDate: { gte: todayStart, lt: todayEnd },
        status: {
          in: ['PENDING', 'CONFLICT', 'CONFIRMED', 'IN_PROGRESS', 'READY'],
        },
      },
      include: {
        catalogItem: {
          include: {
            vendor: { select: { name: true } },
          },
        },
        booking: {
          include: {
            primaryGuest: {
              select: { firstName: true, lastName: true },
            },
            manifestGuests: {
              where: { roomNumber: { not: null } },
              select: { roomNumber: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { preferredTime: 'asc' },
    });

    const scheduleItems = await this.prisma.scheduleItem.findMany({
      where: {
        time: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { time: 'asc' },
    });

    const experienceMapped = experienceRequests.map((req) => ({
      id: req.id,
      time: req.confirmedTime || req.preferredTime,
      title: req.catalogItem.name,
      guestName: `${req.booking.primaryGuest.firstName} ${req.booking.primaryGuest.lastName}`,
      location: req.catalogItem.vendor?.name || null,
      status: req.status,
      type: 'EXPERIENCE',
      requestId: req.id,
      hasConflict: req.status === 'CONFLICT',
    }));

    const scheduleMapped = scheduleItems.map((item) => ({
      id: item.id,
      time: item.time.toTimeString().substring(0, 5),
      title: item.title,
      guestName: item.guestName,
      location: item.location,
      status: 'SCHEDULED',
      type: item.type,
      requestId: null,
      hasConflict: false,
    }));

    return [...experienceMapped, ...scheduleMapped].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
  }

  async addScheduleItem(body: {
    title: string;
    time: string;
    location?: string;
    guestName?: string;
    bookingId?: string;
    type: string;
    notes?: string;
  }) {
    return this.prisma.scheduleItem.create({
      data: {
        title: body.title,
        time: new Date(body.time),
        location: body.location,
        guestName: body.guestName,
        bookingId: body.bookingId,
        type: (body.type as ScheduleItemType) || ScheduleItemType.OTHER,
        notes: body.notes,
        createdBy: 'estate_manager',
      },
    });
  }

  async exportOverview() {
    const kpis = await this.getKpis();
    const rows = [
      ['Metric', 'Value'],
      ['Guests In-House', String(kpis.guestsInHouse)],
      ['Arriving Today', String(kpis.arrivingToday)],
      ['Active Experiences', String(kpis.activeExperiences)],
      ['Pending Approvals', String(kpis.pendingApprovals)],
      ['Revenue Today', String(kpis.revenueToday)],
    ];

    return {
      filename: `operations-overview-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((row) => row.join(',')).join('\n'),
    };
  }
}
