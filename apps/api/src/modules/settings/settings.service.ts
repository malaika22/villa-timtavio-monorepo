import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SINGLETON = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ─── Estate settings (pricing + notification toggles) ─────────────────────

  async getSettings() {
    const existing = await this.prisma.estateSettings.findUnique({
      where: { id: SINGLETON },
    });
    if (existing) return existing;
    return this.prisma.estateSettings.create({ data: { id: SINGLETON } });
  }

  async updateSettings(data: Prisma.EstateSettingsUpdateInput) {
    await this.getSettings(); // ensure row exists
    return this.prisma.estateSettings.update({
      where: { id: SINGLETON },
      data,
    });
  }

  // ─── Staff accounts ───────────────────────────────────────────────────────

  listStaff() {
    return this.prisma.staffAccount.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createStaff(data: { name: string; email: string; role?: StaffRole }) {
    if (!data.name?.trim() || !data.email?.trim()) {
      throw new BadRequestException('Name and email are required');
    }
    const exists = await this.prisma.staffAccount.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new BadRequestException('A staff member with that email already exists');

    return this.prisma.staffAccount.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role ?? 'ESTATE_MANAGER',
      },
    });
  }

  async updateStaff(
    id: string,
    data: { role?: StaffRole; active?: boolean },
  ) {
    const exists = await this.prisma.staffAccount.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Staff account not found');
    return this.prisma.staffAccount.update({ where: { id }, data });
  }

  // ─── Integrations status (derived from configured env keys + last sync) ───

  async integrationsStatus() {
    const latestBooking = await this.prisma.booking.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const configured = (...keys: string[]) =>
      keys.every((k) => !!process.env[k]);

    return [
      {
        key: 'lodgify',
        name: 'Lodgify',
        connected: configured('LODGIFY_API_KEY'),
        lastSyncAt: latestBooking?.updatedAt?.toISOString() ?? null,
      },
      {
        key: 'stripe',
        name: 'Stripe',
        connected: configured('STRIPE_SECRET_KEY'),
        lastSyncAt: null,
      },
      {
        key: 'breezeway',
        name: 'Breezeway',
        // The integration authenticates via OAuth client credentials, so the
        // "connected" light must reflect those — not the legacy API_KEY/ORG_ID.
        connected: configured('BREEZEWAY_CLIENT_ID', 'BREEZEWAY_CLIENT_SECRET'),
        lastSyncAt: null,
      },
      {
        key: 'auth0',
        name: 'Auth0',
        connected: configured('AUTH0_DOMAIN'),
        lastSyncAt: null,
      },
      {
        key: 'sortly',
        name: 'Sortly',
        connected: configured('SORTLY_API_TOKEN'),
        lastSyncAt: null,
      },
    ];
  }
}
