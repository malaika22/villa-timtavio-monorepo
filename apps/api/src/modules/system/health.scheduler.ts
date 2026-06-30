import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Heartbeat sampler — every few minutes it probes the database and records a
 * real {ok, latencyMs} sample. Over time this accumulates genuine uptime and
 * response-time history (no fabricated data); the owner System Health page
 * reads it back via SystemService.getHealth.
 */
@Injectable()
export class HealthScheduler implements OnModuleInit {
  private readonly logger = new Logger(HealthScheduler.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Record one sample immediately on boot so history starts right away.
    await this.sample().catch(() => undefined);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sample() {
    const startedAt = Date.now();
    let ok = true;
    let note: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      ok = false;
      note = err instanceof Error ? err.message.slice(0, 200) : 'probe failed';
    }
    const latencyMs = Date.now() - startedAt;

    try {
      await this.prisma.healthSample.create({ data: { ok, latencyMs, note } });
    } catch {
      // If we can't even write the sample, the DB is down — nothing to do.
    }
  }
}
