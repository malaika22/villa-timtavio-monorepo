// apps/api/src/auth0/magic-link.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MagicLinkService, SendMagicLinkPayload } from './magic-link.service';

@Processor('magic-links')
export class MagicLinkProcessor {
  private readonly logger = new Logger(MagicLinkProcessor.name);

  constructor(private magicLinkService: MagicLinkService) {}

  @Process('send')
  async handleSend(job: Job<SendMagicLinkPayload>) {
    this.logger.log(`Processing magic link job for ${job.data.email}`);
    await this.magicLinkService.processMagicLink(job.data);
  }
}
