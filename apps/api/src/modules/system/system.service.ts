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

    return {
      uptimeSeconds: Math.round(process.uptime()),
      activeSessions,
      magicLinks30d,
      services,
    };
  }
}
