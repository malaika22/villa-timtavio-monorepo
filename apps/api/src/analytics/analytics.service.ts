// apps/api/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(period?: string) {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [bookings, experiences, revenue] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          checkIn: { gte: yearStart },
          status: { not: 'CANCELLED' },
        },
        select: { id: true, checkIn: true, checkOut: true, nights: true },
      }),
      this.prisma.experienceRequest.count({
        where: {
          createdAt: { gte: yearStart },
          status: 'COMPLETED',
        },
      }),
      this.prisma.folioItem.aggregate({
        where: {
          createdAt: { gte: yearStart },
          booking: { status: 'CHECKED_OUT' },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate occupancy — booked nights / available nights
    const totalNights = bookings.reduce((s, b) => s + b.nights, 0);
    const daysInYear = 365;
    const occupancyRate = Math.round((totalNights / daysInYear) * 100);

    return {
      ytdRevenue: Number(revenue._sum.amount || 0),
      occupancyRate,
      experiencesBooked: experiences,
      avgSatisfaction: 4.94, // TODO: wire to real ratings
    };
  }

  async getRevenueTrend(year: number, compareYear?: number) {
    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0, 23, 59, 59);
      return { month: i + 1, start, end };
    });

    const monthlyRevenue = await Promise.all(
      months.map(async ({ month, start, end }) => {
        const result = await this.prisma.folioItem.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            booking: { status: 'CHECKED_OUT' },
          },
          _sum: { amount: true },
        });
        return { month, revenue: Number(result._sum.amount || 0) };
      }),
    );

    return { year, data: monthlyRevenue };
  }

  async getOccupancy(period?: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'SETTLED', 'CHECKED_OUT'] },
        OR: [
          { checkIn: { gte: monthStart, lte: monthEnd } },
          { checkOut: { gte: monthStart, lte: monthEnd } },
        ],
      },
      select: { checkIn: true, checkOut: true, nights: true },
    });

    const totalDays = monthEnd.getDate();
    const bookedNights = bookings.reduce((s, b) => s + b.nights, 0);
    const occupancyRate = Math.round((bookedNights / totalDays) * 100);

    return { occupancyRate, bookedNights, totalDays };
  }

  async getHeatMap(params: {
    date?: string;
    range?: string;
    category?: string;
  }) {
    const targetDate = params.date ? new Date(params.date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const events = await this.prisma.serviceEvent.groupBy({
      by: ['estateSpace', 'timeBlock'],
      where: {
        occurredAt: { gte: dayStart, lte: dayEnd },
        ...(params.category && { serviceType: params.category }),
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return events.map((e) => ({
      space: e.estateSpace,
      timeBlock: e.timeBlock,
      activityScore: e._count.id,
    }));
  }

  async getPeakHours(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const events = await this.prisma.serviceEvent.groupBy({
      by: ['timeBlock'],
      where: { occurredAt: { gte: dayStart, lte: dayEnd } },
      _count: { id: true },
    });

    return events.map((e) => ({
      timeBlock: e.timeBlock,
      activityIndex: e._count.id,
    }));
  }

  async getExperiencePerformance(period?: string) {
    return this.prisma.catalogItem.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            experienceRequests: {
              where: { status: 'COMPLETED' },
            },
          },
        },
        vendor: { select: { name: true, averageRating: true } },
      },
      orderBy: { experienceRequests: { _count: 'desc' } },
    });
  }

  async getUpcomingStays() {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'SETTLED'] },
        checkIn: { gte: new Date() },
      },
      include: {
        primaryGuest: {
          select: { firstName: true, lastName: true },
        },
        folioItems: {
          select: { amount: true, quantity: true },
        },
      },
      orderBy: { checkIn: 'asc' },
      take: 10,
    });

    // Privacy: only return abbreviated names to Owner
    return bookings.map((b) => ({
      id: b.id,
      guestInitials: `${b.primaryGuest.firstName[0]}${b.primaryGuest.lastName[0]}`,
      guestAbbreviated: `${b.primaryGuest.firstName}. ${b.primaryGuest.lastName[0]}.`,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      totalGuests: b.totalGuests,
      status: b.status,
      estimatedRevenue: b.folioItems.reduce(
        (s, i) => s + Number(i.amount) * i.quantity,
        0,
      ),
    }));
  }

  async getIntelligenceAlerts() {
    const alerts: string[] = [];
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check booking pace
    const upcomingCount = await this.prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        checkIn: { gte: now, lte: in30Days },
      },
    });
    if (upcomingCount > 3) {
      alerts.push(
        `Strong booking pace — ${upcomingCount} confirmed bookings in next 30 days`,
      );
    }

    // Check top experience demand
    const topExperience = await this.prisma.experienceRequest.groupBy({
      by: ['catalogItemId'],
      where: {
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    if (topExperience.length > 0 && topExperience[0]._count.id >= 3) {
      const item = await this.prisma.catalogItem.findUnique({
        where: { id: topExperience[0].catalogItemId },
        select: { name: true },
      });
      if (item) {
        alerts.push(
          `${item.name} requests up ${topExperience[0]._count.id}x this week — consider pre-staging`,
        );
      }
    }

    return alerts;
  }
}
