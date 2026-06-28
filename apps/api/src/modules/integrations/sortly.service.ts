import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Sortly inventory sync (optional integration). Guarded: every method
 * no-ops cleanly when SORTLY_API_TOKEN is unset, so the local-DB inventory
 * remains the source of truth in dev.
 */
@Injectable()
export class SortlyService {
  private readonly logger = new Logger(SortlyService.name);
  private readonly token = process.env.SORTLY_API_TOKEN;

  constructor(private prisma: PrismaService) {}

  get enabled(): boolean {
    return Boolean(this.token);
  }

  private client(): AxiosInstance {
    return axios.create({
      baseURL: process.env.SORTLY_API_URL ?? 'https://api.sortly.co/api/v1',
      headers: { Authorization: `Bearer ${this.token}` },
      timeout: 20_000,
    });
  }

  /**
   * Pulls current quantities from Sortly and reconciles them onto matching
   * InventoryItem rows (matched by name, case-insensitive). Items not present
   * in Sortly are left untouched.
   */
  async pullStock(): Promise<{ synced: number } | { skipped: true }> {
    if (!this.enabled) return { skipped: true };

    let remoteItems: Array<{ name?: string; quantity?: number }> = [];
    try {
      const res = await this.client().get('/items', { params: { per_page: 200 } });
      remoteItems = res.data?.data ?? res.data?.items ?? [];
    } catch (err) {
      this.logger.error(`Sortly pull failed: ${String(err)}`);
      return { skipped: true };
    }

    const local = await this.prisma.inventoryItem.findMany();
    const byName = new Map(local.map((i) => [i.name.toLowerCase(), i]));

    let synced = 0;
    for (const remote of remoteItems) {
      if (!remote.name || remote.quantity == null) continue;
      const match = byName.get(remote.name.toLowerCase());
      if (!match) continue;
      if (match.currentStock === remote.quantity) continue;
      await this.prisma.inventoryItem.update({
        where: { id: match.id },
        data: { currentStock: remote.quantity },
      });
      synced++;
    }

    if (synced > 0) this.logger.log(`Sortly sync updated ${synced} item(s)`);
    return { synced };
  }
}
