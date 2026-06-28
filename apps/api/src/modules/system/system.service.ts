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
}
