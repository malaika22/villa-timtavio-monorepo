import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { BreezeWayService } from '../breezeway/breezeway.service';
import { RequestsService } from '../requests/requests.service';
import { PusherService } from '../pusher/pusher.service';
import { SortlyService } from './sortly.service';

@Injectable()
export class IntegrationsScheduler {
  private readonly logger = new Logger(IntegrationsScheduler.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('lodgify-sync') private lodgifyQueue: Queue,
    private breezeway: BreezeWayService,
    private requests: RequestsService,
    private pusher: PusherService,
    private sortly: SortlyService,
  ) {}

  // ─── Lodgify: pull every 5 minutes (webhook is the primary path) ──────────
  @Cron('*/5 * * * *')
  async pullLodgify() {
    if (!process.env.LODGIFY_API_KEY) return;
    await this.lodgifyQueue.add('sync-all', {});
  }

  // ─── Breezeway: poll in-progress tasks for completion / overdue ───────────
  @Cron('*/10 * * * *')
  async pollBreezeway() {
    // Gate on the credentials the service actually authenticates with, so the
    // completion poller runs whenever Breezeway is genuinely configured.
    if (
      !process.env.BREEZEWAY_CLIENT_ID ||
      !process.env.BREEZEWAY_CLIENT_SECRET
    )
      return;

    const inProgress = await this.prisma.experienceRequest.findMany({
      where: { status: 'IN_PROGRESS', breezeWayTaskId: { not: null } },
      include: { catalogItem: true },
    });

    const now = Date.now();
    for (const req of inProgress) {
      try {
        const task = await this.breezeway.getTask(req.breezeWayTaskId!);
        // Breezeway task status is nested ({ code, name }); completion also
        // surfaces as a finished_at timestamp.
        const statusCode =
          task?.status?.code ?? task?.status?.name ?? task?.status;
        const completed =
          statusCode === 'completed' ||
          statusCode === 'finished' ||
          !!task?.finished_at;

        if (completed) {
          const photoUrl = Array.isArray(task?.photos)
            ? task.photos[0]
            : undefined;
          await this.requests.markReady(
            req.id,
            photoUrl,
            task?.finished_by?.full_name ?? undefined,
          );
          continue;
        }

        // Overdue: the scheduled experience time has passed but it isn't ready.
        const when = req.confirmedDate ?? req.preferredDate;
        const minutesOverdue = Math.round((now - when.getTime()) / 60000);
        if (minutesOverdue > 0) {
          await this.pusher.breezeWayTaskOverdue({
            taskId: req.breezeWayTaskId!,
            requestId: req.id,
            experienceName: req.catalogItem.name,
            guestName: req.requestedByName,
            minutesOverdue,
          });
        }
      } catch (err) {
        this.logger.warn(`Breezeway poll failed for ${req.id}: ${String(err)}`);
      }
    }
  }

  // ─── Sortly: pull stock every 15 minutes (optional) ───────────────────────
  @Cron('*/15 * * * *')
  async syncSortly() {
    if (!this.sortly.enabled) return;
    await this.sortly.pullStock().catch((err) =>
      this.logger.error(`Sortly sync failed: ${String(err)}`),
    );
  }
}
