// apps/api/src/auth0/magic-link.processor.ts
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MagicLinkService } from './magic-link.service';
import { SendMagicLinkPayload } from './types';

@Processor('magic-links')
export class MagicLinkProcessor {
  private readonly logger = new Logger(MagicLinkProcessor.name);

  constructor(private magicLinkService: MagicLinkService) {}

  @Process('send')
  async handleSend(job: Job<SendMagicLinkPayload>) {
    this.logger.log(
      `Processing magic link [attempt ${job.attemptsMade + 1}] for ${job.data.email}`,
    );
    await this.magicLinkService.processMagicLink(job.data);
    this.logger.log(`Magic link sent to ${job.data.email}`);
  }

  @OnQueueFailed()
  handleFailed(job: Job, error: Error) {
    this.logger.error(
      `Magic link job failed for ${job.data?.email}: ${error.message}`,
    );
  }
}
