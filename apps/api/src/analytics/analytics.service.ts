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

  // ─── Capital: equipment buy-vs-rent (owner) ───────────────────────────────

  async getEquipmentAnalysis() {
    const items = await this.prisma.equipment.findMany({
      orderBy: { totalUses: 'desc' },
    });

    const rows = items.map((e) => {
      const rentalPerUse = Number(e.rentalCostPerUse ?? 0);
      const purchase = Number(e.purchasePrice ?? 0);
      const maintenance = Number(e.estimatedAnnualMaintenanceCost ?? 0);
      const usesPerYear = e.totalUses; // treat seeded totalUses as annual cadence

      const annualRental = rentalPerUse * usesPerYear;
      const twoYearRental = annualRental * 2;
      const twoYearOwn = purchase + maintenance * 2;
      const savings = Math.round(twoYearRental - twoYearOwn);
      const breakEvenUses =
        rentalPerUse > 0 ? Math.ceil(purchase / rentalPerUse) : null;

      let recommendation: 'BUY' | 'MONITOR' | 'RENT';
      if (savings > purchase * 0.25) recommendation = 'BUY';
      else if (savings > 0) recommendation = 'MONITOR';
      else recommendation = 'RENT';

      // 24-month cumulative cost projection (rental vs own).
      const projection = Array.from({ length: 25 }, (_, m) => ({
        month: m,
        rent: Math.round((annualRental / 12) * m),
        own: Math.round(purchase + (maintenance / 12) * m),
      }));

      return {
        id: e.id,
        name: e.name,
        category: e.category,
        rentalCostPerUse: rentalPerUse,
        purchasePrice: purchase,
        usesPerYear,
        annualRental: Math.round(annualRental),
        breakEvenUses,
        twoYearSavings: savings,
        recommendation,
        seasonalNotes: e.seasonalNotes ?? null,
        annualMaintenance: maintenance,
        projection,
      };
    });

    const totalSavings = rows
      .filter((r) => r.recommendation === 'BUY')
      .reduce((s, r) => s + Math.max(0, r.twoYearSavings), 0);

    return { totalProjectedSavings: totalSavings, items: rows };
  }

  // ─── 30-day occupancy calendar (owner) ────────────────────────────────────

  async getOccupancyCalendar() {
    const days = 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      select: { checkIn: true, checkOut: true, totalGuests: true },
    });

    const result: {
      date: string;
      bookings: number;
      guests: number;
      occupied: boolean;
    }[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const overlapping = bookings.filter(
        (b) => b.checkIn < next && b.checkOut > d,
      );
      result.push({
        date: d.toISOString().slice(0, 10),
        bookings: overlapping.length,
        guests: overlapping.reduce((s, b) => s + b.totalGuests, 0),
        occupied: overlapping.length > 0,
      });
    }

    return result;
  }

  // ─── 52-week experience seasonality (owner) ───────────────────────────────

  async getExperienceSeasonality() {
    const weeks = 52;
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - weeks * 7);

    const requests = await this.prisma.experienceRequest.findMany({
      where: { createdAt: { gte: start } },
      include: { catalogItem: { select: { category: true } } },
    });

    // bucket by ISO-ish week index from start
    const buckets = new Map<number, Map<string, number>>();
    for (const r of requests) {
      const wk = Math.floor(
        (r.createdAt.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000),
      );
      const cat = r.catalogItem.category;
      const m = buckets.get(wk) ?? new Map<string, number>();
      m.set(cat, (m.get(cat) ?? 0) + 1);
      buckets.set(wk, m);
    }

    const data = Array.from({ length: weeks }, (_, wk) => {
      const m = buckets.get(wk) ?? new Map();
      const total = [...m.values()].reduce((s, n) => s + n, 0);
      return { week: wk + 1, total, byCategory: Object.fromEntries(m) };
    });

    return data;
  }

  // ─── Heat-map cell drill-down (owner) ─────────────────────────────────────

  async getHeatMapCell(space: string, timeBlock: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

    const events = await this.prisma.serviceEvent.findMany({
      where: {
        estateSpace: space,
        timeBlock,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { occurredAt: 'asc' },
    });

    const byType = new Map<string, number>();
    let withCost = 0;
    for (const e of events) {
      byType.set(e.serviceType, (byType.get(e.serviceType) ?? 0) + 1);
      if (e.hasCost) withCost += 1;
    }

    return {
      space,
      timeBlock,
      total: events.length,
      withCost,
      withoutCost: events.length - withCost,
      byType: [...byType.entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      timeline: events.map((e) => ({
        time: e.occurredAt.toISOString(),
        serviceType: e.serviceType,
        hasCost: e.hasCost,
      })),
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

    // Satisfaction-vs-revenue scatter: for reviews linked to a booking, plot
    // the stay's settled folio total against the overall score.
    const linked = reviews.filter((r) => r.bookingId);
    const scatter = await Promise.all(
      linked.map(async (r) => {
        const folio = await this.prisma.folioItem.aggregate({
          where: { bookingId: r.bookingId! },
          _sum: { amount: true },
        });
        return {
          name: `Stay ${r.bookingId!.slice(-4)}`,
          satisfaction: r.overall,
          revenue: Number(folio._sum.amount ?? 0),
        };
      }),
    );

    return {
      overall: avg('overall'),
      reviewCount: count,
      categories,
      trend,
      themes: { praise, improvement },
      scatter: scatter.filter((p) => p.revenue > 0),
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
