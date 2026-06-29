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

    const sat = await this.prisma.satisfactionReview.aggregate({
      _avg: { overall: true },
    });

    return {
      ytdRevenue: Number(revenue._sum.amount || 0),
      occupancyRate,
      experiencesBooked: experiences,
      avgSatisfaction: sat._avg.overall
        ? Math.round(sat._avg.overall * 100) / 100
        : 0,
    };
  }

  // ─── Vendor performance (owner) ───────────────────────────────────────────

  async getVendorPerformance() {
    const vendors = await this.prisma.vendor.findMany({
      include: {
        catalogItems: {
          include: {
            experienceRequests: {
              where: {
                status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED'] },
              },
              select: { confirmedCost: true },
            },
          },
        },
      },
    });

    return vendors.map((v) => {
      const requests = v.catalogItems.flatMap((c) => c.experienceRequests);
      const revenue = requests.reduce(
        (s, r) => s + Number(r.confirmedCost ?? 0),
        0,
      );
      return {
        id: v.id,
        name: v.name,
        bookings: requests.length,
        revenue,
        rating: Number(v.averageRating ?? 0),
      };
    });
  }

  // ─── Revenue mix (owner) ──────────────────────────────────────────────────

  async getRevenueMix() {
    const grouped = await this.prisma.folioItem.groupBy({
      by: ['type'],
      where: { booking: { status: 'CHECKED_OUT' } },
      _sum: { amount: true },
    });

    const LABELS: Record<string, string> = {
      ESTATE_BASE_RATE: 'Villa',
      EXPERIENCE: 'Experiences',
      INCIDENTAL: 'Incidentals',
      PRE_STOCKED: 'Pre-stocked',
    };

    const slices = grouped
      .map((g) => ({
        key: g.type,
        label: LABELS[g.type] ?? g.type,
        value: Number(g._sum.amount ?? 0),
      }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = slices.reduce((s, x) => s + x.value, 0);
    return { total, slices };
  }

  // ─── Satisfaction (owner) ─────────────────────────────────────────────────

  async getSatisfaction() {
    const reviews = await this.prisma.satisfactionReview.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const count = reviews.length;
    const avg = (key: 'overall' | 'cleanliness' | 'staff' | 'experiences' | 'privacy' | 'value' | 'arrival') =>
      count === 0
        ? 0
        : Math.round(
            (reviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) / count) * 100,
          ) / 100;

    const categories = [
      { key: 'cleanliness', label: 'Cleanliness', score: avg('cleanliness') },
      { key: 'staff', label: 'Staff', score: avg('staff') },
      { key: 'experiences', label: 'Experiences', score: avg('experiences') },
      { key: 'privacy', label: 'Privacy', score: avg('privacy') },
      { key: 'value', label: 'Value', score: avg('value') },
      { key: 'arrival', label: 'Arrival', score: avg('arrival') },
    ];

    // Monthly sentiment trend (avg overall per month).
    const byMonth = new Map<string, { sum: number; n: number }>();
    for (const r of reviews) {
      const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) ?? { sum: 0, n: 0 };
      cur.sum += r.overall;
      cur.n += 1;
      byMonth.set(key, cur);
    }
    const trend = [...byMonth.entries()].map(([month, { sum, n }]) => ({
      month,
      score: Math.round((sum / n) * 100) / 100,
    }));

    // Themes: praise = strongest categories, improvement = weakest below 4.5
    // (a production build would NLP the free-text comments).
    const sorted = [...categories].sort((a, b) => b.score - a.score);
    const praise = sorted.slice(0, 2).map((c) => c.label);
    const improvement = sorted
      .slice(-2)
      .filter((c) => c.score < 4.5)
      .map((c) => c.label);

    return {
      overall: avg('overall'),
      reviewCount: count,
      categories,
      trend,
      themes: { praise, improvement },
    };
  }

  async getRevenueTrend(year: number, compareYear?: number) {
    const monthlyFor = (y: number) =>
      Promise.all(
        Array.from({ length: 12 }, (_, i) => i).map(async (i) => {
          const start = new Date(y, i, 1);
          const end = new Date(y, i + 1, 0, 23, 59, 59);
          const result = await this.prisma.folioItem.aggregate({
            where: {
              createdAt: { gte: start, lte: end },
              booking: { status: 'CHECKED_OUT' },
            },
            _sum: { amount: true },
          });
          return { month: i + 1, revenue: Number(result._sum.amount || 0) };
        }),
      );

    const compare = compareYear ?? year - 1;
    const [current, prior] = await Promise.all([
      monthlyFor(year),
      monthlyFor(compare),
    ]);

    const data = current.map((c, i) => ({
      month: c.month,
      revenue: c.revenue,
      compareRevenue: prior[i].revenue,
    }));

    return { year, compareYear: compare, data };
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
