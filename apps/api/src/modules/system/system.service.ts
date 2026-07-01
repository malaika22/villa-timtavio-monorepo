import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getLodgifySyncStatus() {
    const latest = await this.prisma.booking.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      lastSyncAt: latest?.updatedAt?.toISOString() ?? null,
    };
  }

  async getSystemAlerts(category?: string, isDismissed = false) {
    return this.prisma.systemAlert.findMany({
      where: {
        ...(category ? { category } : {}),
        isDismissed,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dismissAlert(id: string) {
    return this.prisma.systemAlert.update({
      where: { id },
      data: { isDismissed: true, dismissedAt: new Date(), dismissedBy: 'em' },
    });
  }

  // Active guest PWA sessions: manifest guests who have opened their link and
  // whose stay is currently in-house. Privacy-safe — abbreviated names only,
  // no email. Device/screen aren't collected, so they're not returned.
  async getActiveSessions() {
    const guests = await this.prisma.manifestGuest.findMany({
      where: {
        pwaLinkOpened: true,
        booking: { status: { in: ['CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'] } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        pwaLinkOpenedAt: true,
        booking: { select: { primaryGuest: { select: { email: true } } } },
      },
      orderBy: { pwaLinkOpenedAt: 'desc' },
    });

    return guests.map((g) => {
      const lastInitial = g.lastName ? `${g.lastName[0]}.` : '';
      const isPrimary = g.email === g.booking.primaryGuest?.email;
      return {
        id: g.id,
        name: `${g.firstName} ${lastInitial}`.trim(),
        initials:
          `${g.firstName[0] ?? ''}${g.lastName[0] ?? ''}`.toUpperCase(),
        role: isPrimary ? 'Primary member' : 'Guest',
        sessionStartAt: g.pwaLinkOpenedAt?.toISOString() ?? null,
      };
    });
  }

  // ─── Live platform health (owner) ─────────────────────────────────────────

  async getHealth() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const [activeSessions, magicLinks30d, latestBooking] = await Promise.all([
      // In-house stays are a proxy for active guest sessions.
      this.prisma.booking.count({
        where: { status: { in: ['CHECKED_IN', 'SETTLED', 'DEPARTURE_TODAY'] } },
      }),
      this.prisma.manifestGuest.count({
        where: { pwaLinkSent: true, pwaLinkSentAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.booking.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);

    const configured = (...keys: string[]) =>
      keys.every((k) => !!process.env[k]);

    const services = [
      { key: 'lodgify', name: 'Lodgify', connected: configured('LODGIFY_API_KEY'), lastSyncAt: latestBooking?.updatedAt?.toISOString() ?? null },
      { key: 'stripe', name: 'Stripe', connected: configured('STRIPE_SECRET_KEY'), lastSyncAt: null },
      { key: 'breezeway', name: 'Breezeway', connected: configured('BREEZEWAY_API_KEY', 'BREEZEWAY_ORG_ID'), lastSyncAt: null },
      { key: 'auth0', name: 'Auth0', connected: configured('AUTH0_DOMAIN'), lastSyncAt: null },
      { key: 'resend', name: 'Resend', connected: configured('RESEND_API_KEY'), lastSyncAt: null },
      { key: 'pusher', name: 'Pusher', connected: configured('PUSHER_APP_ID'), lastSyncAt: null },
    ];

    // Real telemetry from accumulated heartbeat samples (last 90 days).
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    const samples = await this.prisma.healthSample.findMany({
      where: { checkedAt: { gte: ninetyDaysAgo } },
      orderBy: { checkedAt: 'asc' },
      select: { checkedAt: true, ok: true, latencyMs: true, note: true },
    });

    const okCount = samples.filter((s) => s.ok).length;
    const uptimePercent =
      samples.length > 0
        ? Math.round((okCount / samples.length) * 10000) / 100
        : null;
    const avgResponseMs =
      samples.length > 0
        ? Math.round(
            samples.reduce((s, x) => s + x.latencyMs, 0) / samples.length,
          )
        : null;

    // 90-day daily history: up-ratio per day.
    const byDay = new Map<string, { ok: number; total: number }>();
    for (const s of samples) {
      const key = s.checkedAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { ok: 0, total: 0 };
      cur.total += 1;
      if (s.ok) cur.ok += 1;
      byDay.set(key, cur);
    }
    const history = Array.from({ length: 90 }, (_, i) => {
      const d = new Date(now.getTime() - (89 - i) * 24 * 3600 * 1000)
        .toISOString()
        .slice(0, 10);
      const b = byDay.get(d);
      const ratio = b ? b.ok / b.total : null;
      return {
        date: d,
        status:
          ratio == null
            ? ('no-data' as const)
            : ratio >= 0.99
              ? ('operational' as const)
              : ratio >= 0.9
                ? ('degraded' as const)
                : ('outage' as const),
      };
    });

    // Incidents = runs of consecutive failed samples.
    const incidents: { startedAt: string; endedAt: string; samples: number }[] = [];
    let run: { start: Date; end: Date; n: number } | null = null;
    for (const s of samples) {
      if (!s.ok) {
        if (!run) run = { start: s.checkedAt, end: s.checkedAt, n: 1 };
        else {
          run.end = s.checkedAt;
          run.n += 1;
        }
      } else if (run) {
        incidents.push({
          startedAt: run.start.toISOString(),
          endedAt: run.end.toISOString(),
          samples: run.n,
        });
        run = null;
      }
    }
    if (run) {
      incidents.push({
        startedAt: run.start.toISOString(),
        endedAt: run.end.toISOString(),
        samples: run.n,
      });
    }

    return {
      uptimeSeconds: Math.round(process.uptime()),
      uptimePercent,
      avgResponseMs,
      sampleCount: samples.length,
      activeSessions,
      magicLinks30d,
      services,
      history,
      incidents: incidents.reverse().slice(0, 10),
    };
  }
}
