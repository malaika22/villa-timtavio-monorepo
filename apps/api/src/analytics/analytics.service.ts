// apps/api/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Resolve the start of an owner period window. Defaults to YTD.
  private resolvePeriodStart(period?: string): Date {
    const now = new Date();
    switch (period) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      case 'mtd':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'qtd':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'ytd':
      default:
        return new Date(now.getFullYear(), 0, 1);
    }
  }

  async getOverview(period?: string) {
    const now = new Date();
    // Resolve the requested window. Defaults to YTD.
    const start = (() => {
      switch (period) {
        case '30d':
          return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        case '90d':
          return new Date(now.getTime() - 90 * 24 * 3600 * 1000);
        case 'mtd':
          return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'qtd':
          return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        case 'ytd':
        default:
          return new Date(now.getFullYear(), 0, 1);
      }
    })();
    const windowDays = Math.max(
      1,
      Math.round((now.getTime() - start.getTime()) / (24 * 3600 * 1000)),
    );

    const [bookings, experiences, revenue] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          checkIn: { gte: start },
          status: { not: 'CANCELLED' },
        },
        select: { id: true, checkIn: true, checkOut: true, nights: true },
      }),
      this.prisma.experienceRequest.count({
        where: {
          createdAt: { gte: start },
          status: 'COMPLETED',
        },
      }),
      this.prisma.folioItem.aggregate({
        where: {
          createdAt: { gte: start },
          booking: { status: 'CHECKED_OUT' },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate occupancy — booked nights / available nights in the window
    const totalNights = bookings.reduce((s, b) => s + b.nights, 0);
    const occupancyRate = Math.round((totalNights / windowDays) * 100);

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

  // ─── Unmet demand (owner) ─────────────────────────────────────────────────
  // Inquiries whose requested dates overlapped an existing booking (estate was
  // unavailable) and never converted — i.e. demand we couldn't serve.

  async getUnmetDemand() {
    const [inquiries, bookings] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: {
          convertedToBookingId: null,
          preferredFrom: { not: null },
          preferredTo: { not: null },
        },
        select: {
          id: true,
          preferredFrom: true,
          preferredTo: true,
          guestCount: true,
          status: true,
        },
      }),
      this.prisma.booking.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { checkIn: true, checkOut: true, baseRate: true, nights: true },
      }),
    ]);

    const totalBase = bookings.reduce((s, b) => s + Number(b.baseRate), 0);
    const totalNights = bookings.reduce((s, b) => s + b.nights, 0);
    const avgNightly = totalNights > 0 ? totalBase / totalNights : 0;

    const unmet = inquiries
      .filter((i) =>
        bookings.some(
          (b) => b.checkIn < i.preferredTo! && b.checkOut > i.preferredFrom!,
        ),
      )
      .map((i) => {
        const nights = Math.max(
          1,
          Math.round(
            (i.preferredTo!.getTime() - i.preferredFrom!.getTime()) /
              (24 * 3600 * 1000),
          ),
        );
        return {
          id: i.id,
          from: i.preferredFrom!.toISOString().slice(0, 10),
          to: i.preferredTo!.toISOString().slice(0, 10),
          nights,
          guestCount: i.guestCount ?? null,
          estimatedRevenue: Math.round(nights * avgNightly),
        };
      });

    return {
      count: unmet.length,
      estimatedLostRevenue: unmet.reduce((s, u) => s + u.estimatedRevenue, 0),
      items: unmet,
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

  // ─── Monthly occupancy %, current vs prior year (owner) ───────────────────

  async getOccupancyMonthly() {
    const year = new Date().getFullYear();
    const compare = year - 1;

    const monthFor = async (y: number, m: number) => {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const bookings = await this.prisma.booking.findMany({
        where: {
          status: { not: 'CANCELLED' },
          checkIn: { lte: end },
          checkOut: { gte: start },
        },
        select: { checkIn: true, checkOut: true },
      });
      // Count distinct occupied days in the month.
      const occupied = new Set<number>();
      for (const b of bookings) {
        for (let d = 1; d <= daysInMonth; d++) {
          const day = new Date(y, m, d);
          const next = new Date(y, m, d + 1);
          if (b.checkIn < next && b.checkOut > day) occupied.add(d);
        }
      }
      return Math.round((occupied.size / daysInMonth) * 100);
    };

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = await Promise.all(
      MONTHS.map(async (label, m) => ({
        month: label,
        y2026: await monthFor(year, m),
        y2025: await monthFor(compare, m),
      })),
    );
    return data;
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

  // ─── Heat-map insights (owner) — computed, not stored ─────────────────────

  async getHeatMapInsights() {
    const targetDate = new Date();
    const dayStart = new Date(new Date(targetDate).setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(targetDate).setHours(23, 59, 59, 999));

    const events = await this.prisma.serviceEvent.findMany({
      where: { occurredAt: { gte: dayStart, lte: dayEnd } },
      select: { estateSpace: true, timeBlock: true, hasCost: true },
    });

    if (events.length === 0) {
      return { insights: ['No service activity recorded today yet.'] };
    }

    const bySpace = new Map<string, number>();
    const byBlock = new Map<string, number>();
    let billable = 0;
    for (const e of events) {
      bySpace.set(e.estateSpace, (bySpace.get(e.estateSpace) ?? 0) + 1);
      byBlock.set(e.timeBlock, (byBlock.get(e.timeBlock) ?? 0) + 1);
      if (e.hasCost) billable += 1;
    }
    const topSpace = [...bySpace.entries()].sort((a, b) => b[1] - a[1])[0];
    const topBlock = [...byBlock.entries()].sort((a, b) => b[1] - a[1])[0];
    const quietSpace = [...bySpace.entries()].sort((a, b) => a[1] - b[1])[0];
    const billablePct = Math.round((billable / events.length) * 100);

    const insights = [
      `${topSpace[0]} is the busiest space today (${topSpace[1]} events).`,
      `Peak activity is around ${topBlock[0]} (${topBlock[1]} events).`,
      `${billablePct}% of activity is billable — an upsell signal.`,
      `${quietSpace[0]} is quietest — a window for maintenance or a featured offer.`,
    ];
    return { insights };
  }

  // ─── Experience demand insights (owner) — computed ────────────────────────

  async getExperienceInsights() {
    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const prev30 = new Date(now.getTime() - 60 * 24 * 3600 * 1000);

    const reqs = await this.prisma.experienceRequest.findMany({
      where: { createdAt: { gte: prev30 } },
      include: { catalogItem: { select: { name: true } } },
    });

    if (reqs.length === 0) {
      return { insights: ['Not enough experience requests yet for insights.'] };
    }

    const recent = new Map<string, number>();
    const prior = new Map<string, number>();
    const declined = new Map<string, number>();
    for (const r of reqs) {
      const name = r.catalogItem.name;
      if (r.createdAt >= last30)
        recent.set(name, (recent.get(name) ?? 0) + 1);
      else prior.set(name, (prior.get(name) ?? 0) + 1);
      if (r.status === 'CANCELLED')
        declined.set(name, (declined.get(name) ?? 0) + 1);
    }

    const topRecent = [...recent.entries()].sort((a, b) => b[1] - a[1])[0];
    const topDeclined = [...declined.entries()].sort((a, b) => b[1] - a[1])[0];

    // Biggest mover vs prior 30 days.
    let mover: { name: string; delta: number } | null = null;
    for (const [name, n] of recent) {
      const delta = n - (prior.get(name) ?? 0);
      if (!mover || delta > mover.delta) mover = { name, delta };
    }

    const insights: string[] = [];
    if (topRecent)
      insights.push(
        `${topRecent[0]} is the most requested experience this month (${topRecent[1]}).`,
      );
    if (mover && mover.delta > 0)
      insights.push(
        `${mover.name} demand is up ${mover.delta} vs the prior 30 days — consider pre-staging.`,
      );
    if (topDeclined)
      insights.push(
        `${topDeclined[0]} has the most declines — review pricing or availability.`,
      );
    if (insights.length === 0)
      insights.push('Demand is steady across experiences this month.');
    return { insights };
  }

  // ─── Vendor demand forecast (owner) — computed from run-rate ──────────────

  async getVendorForecast() {
    const ninetyAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const vendors = await this.prisma.vendor.findMany({
      include: {
        catalogItems: {
          include: {
            experienceRequests: {
              where: {
                createdAt: { gte: ninetyAgo },
                status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED'] },
              },
              select: { id: true },
            },
          },
        },
      },
    });

    return vendors
      .map((v) => {
        const last90 = v.catalogItems.flatMap((c) => c.experienceRequests).length;
        // Run-rate → projected next quarter (~90 days).
        const projectedNextQuarter = Math.round(last90);
        const monthlyRate = Math.round((last90 / 3) * 10) / 10;
        let recommendation: string;
        if (last90 >= 12) recommendation = 'High demand — secure capacity';
        else if (last90 >= 4) recommendation = 'Steady — maintain availability';
        else recommendation = 'Low — review or rotate';
        return {
          id: v.id,
          name: v.name,
          last90,
          monthlyRate,
          projectedNextQuarter,
          recommendation,
        };
      })
      .sort((a, b) => b.projectedNextQuarter - a.projectedNextQuarter);
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
        category: v.catalogItems[0]?.category ?? 'GENERAL',
        status: v.status,
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

    // Top-10 line items by description (excludes the base villa rate).
    const items = await this.prisma.folioItem.groupBy({
      by: ['description'],
      where: {
        booking: { status: 'CHECKED_OUT' },
        type: { not: 'ESTATE_BASE_RATE' },
      },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    const topItems = items.map((i) => ({
      description: i.description,
      total: Number(i._sum.amount ?? 0),
      count: i._count.id,
    }));

    return { total, slices, topItems };
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

  // Revenue summary header: real MoM + YoY comparisons plus a few headline
  // operating metrics, all computed from folio + booking data. Single-estate,
  // so RevPAV uses one available villa (available nights = days elapsed).
  async getRevenueSummary() {
    const now = new Date();
    const DAY = 24 * 3600 * 1000;

    const revenueBetween = async (start: Date, end: Date) => {
      const r = await this.prisma.folioItem.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          booking: { status: 'CHECKED_OUT' },
        },
        _sum: { amount: true },
      });
      return Number(r._sum.amount || 0);
    };

    // YTD window this year vs the same span last year.
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const priorYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const priorYearSamePoint = new Date(now.getTime() - 365 * DAY);
    const daysElapsed = Math.max(1, Math.round((now.getTime() - yearStart.getTime()) / DAY));

    // Month-over-month.
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [revenue, priorRevenue, momCurrent, momPrior, allBookings] =
      await Promise.all([
        revenueBetween(yearStart, now),
        revenueBetween(priorYearStart, priorYearSamePoint),
        revenueBetween(thisMonthStart, now),
        revenueBetween(lastMonthStart, lastMonthEnd),
        this.prisma.booking.findMany({
          where: { status: { not: 'CANCELLED' } },
          select: { checkIn: true, nights: true, primaryGuestId: true },
        }),
      ]);

    // Lifetime booking count per guest → drives repeat-guest rate.
    const lifetime = new Map<string, number>();
    for (const b of allBookings) {
      lifetime.set(b.primaryGuestId, (lifetime.get(b.primaryGuestId) ?? 0) + 1);
    }

    const inWindow = (start: Date, end: Date) =>
      allBookings.filter((b) => b.checkIn >= start && b.checkIn <= end);
    const current = inWindow(yearStart, now);
    const prior = inWindow(priorYearStart, priorYearSamePoint);

    const avgNights = (rows: typeof allBookings) =>
      rows.length === 0
        ? 0
        : rows.reduce((s, b) => s + b.nights, 0) / rows.length;
    const repeatRate = (rows: typeof allBookings) =>
      rows.length === 0
        ? 0
        : Math.round(
            (rows.filter((b) => (lifetime.get(b.primaryGuestId) ?? 0) > 1).length /
              rows.length) *
              100,
          );

    const pct = (cur: number, base: number): number | null =>
      base > 0 ? Math.round(((cur - base) / base) * 100) : null;

    // RevPAV — revenue per available villa-night (one villa in this estate).
    const revPav = Math.round(revenue / daysElapsed);
    const priorDays = Math.max(
      1,
      Math.round((priorYearSamePoint.getTime() - priorYearStart.getTime()) / DAY),
    );
    const priorRevPav = Math.round(priorRevenue / priorDays);

    return {
      year: now.getFullYear(),
      revenue,
      revenueYoyPercent: pct(revenue, priorRevenue),
      revenueMomPercent: pct(momCurrent, momPrior),
      priorYearRevenue: priorRevenue,
      revPav,
      revPavYoyPercent: pct(revPav, priorRevPav),
      avgStayNights: Math.round(avgNights(current) * 10) / 10,
      priorAvgStayNights: Math.round(avgNights(prior) * 10) / 10,
      repeatRatePercent: repeatRate(current),
      priorRepeatRatePercent: repeatRate(prior),
    };
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

  // Hourly activity for the Peak Hours chart (6am–11pm window). Buckets real
  // ServiceEvent timestamps by hour-of-day, normalises to a 0–100 index against
  // the busiest hour, and flags the top tier as "peak".
  async getPeakHours(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const events = await this.prisma.serviceEvent.findMany({
      where: { occurredAt: { gte: dayStart, lte: dayEnd } },
      select: { occurredAt: true },
    });

    // Count events per hour of day.
    const counts = new Array(24).fill(0) as number[];
    for (const e of events) {
      counts[new Date(e.occurredAt).getHours()] += 1;
    }

    const START_HOUR = 6;
    const END_HOUR = 23;
    const window = counts.slice(START_HOUR, END_HOUR + 1);
    const max = Math.max(1, ...window);

    const label = (h: number) => {
      const period = h < 12 ? 'am' : 'pm';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${hour12}${period}`;
    };

    return window.map((count, i) => {
      const hour = START_HOUR + i;
      const index = Math.round((count / max) * 100);
      return { hour: label(hour), index, count, peak: index >= 70 };
    });
  }

  // Strategic recommendations for experiences — generated from the same live
  // performance rows (top revenue, accelerating demand, high cancellation,
  // under-rated). Structured {variant,title,message} for the panel.
  async getExperienceRecommendations() {
    const rows = await this.getExperiencePerformance();
    const active = rows.filter((r) => r.bookings > 0);
    if (active.length === 0) return { recommendations: [] };

    const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const recs: {
      id: string;
      variant: 'success' | 'info' | 'warning';
      title: string;
      message: string;
    }[] = [];
    const used = new Set<string>();

    // 1) Top revenue experience → feature it.
    const top = [...active].sort((a, b) => b.revenue - a.revenue)[0];
    if (top && top.revenue > 0) {
      used.add(top.id);
      recs.push({
        id: `exp-rec-top-${top.id}`,
        variant: 'success',
        title: `${top.name}:`,
        message: `top revenue experience at ${money(top.revenue)} across ${top.bookings} booking${
          top.bookings === 1 ? '' : 's'
        }${top.rating ? ` (${top.rating.toFixed(1)}★)` : ''}. Feature it in pre-arrival concierge offers and protect peak slots.`,
      });
    }

    // 2) Fastest-accelerating demand → pre-stage.
    const rising = [...active]
      .filter((r) => r.trendPercent !== null && r.trendPercent > 0 && !used.has(r.id))
      .sort((a, b) => (b.trendPercent ?? 0) - (a.trendPercent ?? 0))[0];
    if (rising) {
      used.add(rising.id);
      recs.push({
        id: `exp-rec-rising-${rising.id}`,
        variant: 'info',
        title: `${rising.name}:`,
        message: `demand is up ${rising.trendPercent}% over the last 90 days — pre-stage staff and inventory before the next peak.`,
      });
    }

    // 3) Highest cancellation rate → review.
    const declining = [...active]
      .filter((r) => r.declinedPercent >= 15 && !used.has(r.id))
      .sort((a, b) => b.declinedPercent - a.declinedPercent)[0];
    if (declining) {
      used.add(declining.id);
      recs.push({
        id: `exp-rec-decline-${declining.id}`,
        variant: 'warning',
        title: `${declining.name}:`,
        message: `${declining.declinedPercent}% of requests are cancelled — review pricing, capacity or vendor availability.`,
      });
    }

    // 4) Under-rated experience → audit quality.
    const lowRated = [...active]
      .filter((r) => r.rating > 0 && r.rating < 4.5 && !used.has(r.id))
      .sort((a, b) => a.rating - b.rating)[0];
    if (lowRated) {
      used.add(lowRated.id);
      recs.push({
        id: `exp-rec-rating-${lowRated.id}`,
        variant: 'warning',
        title: `${lowRated.name}:`,
        message: `guest rating is ${lowRated.rating.toFixed(1)}★ — audit the vendor and delivery before promoting it further.`,
      });
    }

    return { recommendations: recs };
  }

  // Per-experience performance rows built from real requests: completed
  // bookings, revenue (confirmed cost, falling back to base price), guest
  // rating, cancellation rate and a 90-day-over-90-day booking trend.
  async getExperiencePerformance(period?: string) {
    const items = await this.prisma.catalogItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        basePrice: true,
        experienceRequests: {
          select: {
            status: true,
            confirmedCost: true,
            createdAt: true,
            vendorRating: { select: { rating: true } },
          },
        },
      },
    });

    const now = Date.now();
    const D90 = 90 * 24 * 3600 * 1000;
    const base = (p: unknown) => Number(p ?? 0);
    // Bookings/revenue/rating honour the requested window; the trend is always
    // a 90d-over-90d comparison independent of the selected period.
    const windowStart = this.resolvePeriodStart(period);

    const rows = items.map((item) => {
      const reqs = item.experienceRequests;
      const inWindow = reqs.filter(
        (r) => new Date(r.createdAt) >= windowStart,
      );
      const completed = inWindow.filter((r) => r.status === 'COMPLETED');
      const cancelled = inWindow.filter((r) => r.status === 'CANCELLED');
      const bookings = completed.length;

      const revenue = completed.reduce(
        (s, r) => s + (r.confirmedCost != null ? Number(r.confirmedCost) : base(item.basePrice)),
        0,
      );

      const ratings = inWindow
        .map((r) => r.vendorRating?.rating)
        .filter((v): v is number => typeof v === 'number');
      const rating =
        ratings.length > 0
          ? Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10
          : 0;

      const declineBase = bookings + cancelled.length;
      const declinedPercent =
        declineBase > 0 ? Math.round((cancelled.length / declineBase) * 100) : 0;

      const last90 = completed.filter(
        (r) => now - new Date(r.createdAt).getTime() < D90,
      ).length;
      const prior90 = completed.filter((r) => {
        const age = now - new Date(r.createdAt).getTime();
        return age >= D90 && age < 2 * D90;
      }).length;
      const trendPercent =
        prior90 > 0
          ? Math.round(((last90 - prior90) / prior90) * 100)
          : last90 > 0
            ? 100
            : null;

      return {
        id: item.id,
        name: item.name,
        bookings,
        revenue,
        rating,
        declined: cancelled.length,
        declinedPercent,
        trendPercent,
      };
    });

    return rows.sort((a, b) => b.bookings - a.bookings);
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
