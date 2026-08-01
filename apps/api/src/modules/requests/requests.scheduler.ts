import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EXPERIENCE_LEAD_TIMES } from '../breezeway/breezeway.config';

/** Extra margin on top of the setup lead time before we start nagging. */
const WARNING_BUFFER_MINUTES = 60;

@Injectable()
export class RequestsScheduler {
  private readonly logger = new Logger(RequestsScheduler.name);

  constructor(private prisma: PrismaService) {}

  /**
   * A priced experience only gets its Breezeway setup task once its cost is
   * agreed — that way nothing is booked with a vendor for an experience the
   * primary might still decline.
   *
   * The cost of that ordering is a quiet failure mode: confirm a priced
   * experience, never log the cost, and no task is ever created. Nobody would
   * notice until staff failed to turn up. This flags those before the setup
   * window closes, and clears the alert once a cost lands or the request moves
   * on, so it can't accumulate stale warnings.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async flagConfirmedButUnpriced() {
    const now = new Date();

    const candidates = await this.prisma.experienceRequest.findMany({
      where: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'READY'] },
        confirmedCost: null,
        confirmedDate: { gte: now },
        breezeWayTaskId: null,
        catalogItem: { isIncluded: false },
      },
      include: { catalogItem: true },
    });

    // Only those close enough that the setup window is about to matter.
    const overdue = candidates.filter((r) => {
      const lead =
        r.catalogItem.setupLeadTimeMinutes ||
        EXPERIENCE_LEAD_TIMES[r.catalogItem.category] ||
        60;
      const actionBy =
        r.confirmedDate!.getTime() - (lead + WARNING_BUFFER_MINUTES) * 60_000;
      return now.getTime() >= actionBy;
    });

    const overdueIds = new Set(overdue.map((r) => r.id));

    const existing = await this.prisma.systemAlert.findMany({
      where: {
        category: 'BOOKING',
        entityType: 'ExperienceRequest',
        title: 'Experience confirmed but not priced',
        isDismissed: false,
      },
    });
    const alerted = new Set(existing.map((a) => a.entityId));

    const toCreate = overdue.filter((r) => !alerted.has(r.id));
    if (toCreate.length > 0) {
      await this.prisma.systemAlert.createMany({
        data: toCreate.map((r) => ({
          severity: 'WARNING',
          title: 'Experience confirmed but not priced',
          message: `${r.catalogItem.name} for ${r.requestedByName} is confirmed but has no agreed cost, so no setup task has been created. Log the cost to schedule staff.`,
          category: 'BOOKING',
          entityType: 'ExperienceRequest',
          entityId: r.id,
        })),
      });
    }

    // Self-healing: a cost was logged, or the request was cancelled/completed.
    const resolved = existing.filter((a) => !overdueIds.has(a.entityId ?? ''));
    if (resolved.length > 0) {
      await this.prisma.systemAlert.updateMany({
        where: { id: { in: resolved.map((a) => a.id) } },
        data: {
          isDismissed: true,
          dismissedAt: new Date(),
          dismissedBy: 'system',
        },
      });
    }

    if (toCreate.length + resolved.length > 0) {
      this.logger.log(
        `Unpriced-experience alerts: +${toCreate.length} / -${resolved.length}`,
      );
    }
  }
}
