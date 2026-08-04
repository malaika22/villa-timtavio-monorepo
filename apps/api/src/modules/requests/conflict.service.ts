import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Conflict detection for experience requests.
 *
 * v1 rule (product-defined): two experiences conflict when they compete for the
 * same EXCLUSIVE resource at OVERLAPPING times. The resource is the vendor when
 * one is set (a vendor can't run two experiences at once), otherwise the catalog
 * item itself (the villa owns a single boat / chef station / spa room). Only
 * already-committed requests (CONFIRMED / IN_PROGRESS / READY) hold a slot — the
 * first to be confirmed wins it; a later overlapping confirm is what conflicts.
 */
@Injectable()
export class ConflictService {
  /** Fallback experience length when a catalog item has no duration set. */
  private static readonly DEFAULT_DURATION_MIN = 90;

  constructor(private prisma: PrismaService) {}

  private toWindow(dateOnly: Date, time: string | null, durationMin: number) {
    const [h, m] = (time ?? '00:00').split(':').map((n) => Number(n));
    const start = new Date(dateOnly);
    start.setHours(
      Number.isFinite(h) ? h : 0,
      Number.isFinite(m) ? m : 0,
      0,
      0,
    );
    const end = new Date(start.getTime() + durationMin * 60_000);
    return { start, end };
  }

  /**
   * Returns the first committed request that competes for the same resource at
   * an overlapping time, plus a human-readable reason — or null if the slot is
   * free.
   */
  /**
   * Windows already committed for a resource, so the guest can be shown them.
   *
   * The engine only ever ran at confirm time, which meant a guest could pick a
   * slot the app already knew was taken, wait, and be declined for something
   * that was impossible when they tapped it. Same candidate query as the
   * conflict check, so the two can't disagree about what "taken" means.
   */
  async findCommittedWindows(params: {
    catalogItemId: string;
    from: Date;
    to: Date;
  }): Promise<{ date: string; time: string | null }[]> {
    const item = await this.prisma.catalogItem.findUnique({
      where: { id: params.catalogItemId },
      select: { id: true, vendorId: true },
    });
    if (!item) return [];

    const committed = await this.prisma.experienceRequest.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] },
        catalogItem: item.vendorId
          ? { vendorId: item.vendorId }
          : { id: item.id, vendorId: null },
      },
      select: {
        confirmedDate: true,
        preferredDate: true,
        confirmedTime: true,
        preferredTime: true,
      },
    });

    return committed
      .map((c) => ({
        at: c.confirmedDate ?? c.preferredDate,
        time: c.confirmedTime ?? c.preferredTime,
      }))
      .filter((c) => c.at >= params.from && c.at <= params.to)
      .map((c) => ({
        date: c.at.toISOString().slice(0, 10),
        time: c.time,
      }));
  }

  async findResourceConflict(params: {
    requestId: string;
    catalogItemId: string;
    vendorId: string | null;
    date: Date;
    time: string | null;
    durationMin: number | null;
  }): Promise<{ blockerId: string; reason: string } | null> {
    const { start, end } = this.toWindow(
      params.date,
      params.time,
      params.durationMin ?? ConflictService.DEFAULT_DURATION_MIN,
    );

    // Narrow to requests sharing the exclusive resource, then check overlap in
    // memory (the candidate set for one villa is small).
    const candidates = await this.prisma.experienceRequest.findMany({
      where: {
        id: { not: params.requestId },
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] },
        catalogItem: params.vendorId
          ? { vendorId: params.vendorId }
          : { id: params.catalogItemId, vendorId: null },
      },
      include: { catalogItem: { include: { vendor: true } } },
    });

    for (const c of candidates) {
      const cDate = c.confirmedDate ?? c.preferredDate;
      const cTime = c.confirmedTime ?? c.preferredTime;
      const cw = this.toWindow(
        cDate,
        cTime,
        c.catalogItem.durationMinutes ?? ConflictService.DEFAULT_DURATION_MIN,
      );

      // Half-open overlap: [start, end) intersects [cw.start, cw.end).
      if (start < cw.end && cw.start < end) {
        const resource = c.catalogItem.vendor?.name ?? c.catalogItem.name;
        const when = `${cDate.toISOString().slice(0, 10)}${
          cTime ? ` ${cTime}` : ''
        }`;
        return {
          blockerId: c.id,
          reason: `Overlaps with "${c.catalogItem.name}" (${resource}) on ${when}`,
        };
      }
    }

    return null;
  }
}
