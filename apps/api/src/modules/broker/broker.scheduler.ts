import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BrokerService } from './broker.service';

/**
 * Retires holds whose 48 hours have run out.
 *
 * Bookkeeping, not correctness: availability reads already ignore a PENDING
 * hold past its expiry, so the calendar reopens the nights the instant the
 * clock passes regardless of when this runs. What this fixes is the estate's
 * queue, which would otherwise fill with rows still claiming to be live.
 */
@Injectable()
export class BrokerScheduler {
  private readonly logger = new Logger(BrokerScheduler.name);

  constructor(private broker: BrokerService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireHolds() {
    try {
      await this.broker.sweepExpired();
    } catch (error) {
      this.logger.error(`Hold sweep failed: ${String(error)}`);
    }
  }
}
