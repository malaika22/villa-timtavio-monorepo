import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { BreezeWayService } from '../breezeway/breezeway.service';
import { RequestsService } from '../requests/requests.service';

@Controller('webhooks/breezeway')
export class BreezeWayWebhookController {
  private readonly logger = new Logger(BreezeWayWebhookController.name);

  constructor(
    private breezeWayService: BreezeWayService,
    private requestsService: RequestsService,
  ) {}

  @Post()
  @Public()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: any,
  ) {
    const signature = headers['x-breezeway-signature'];

    if (!req.rawBody?.length) {
      this.logger.warn('Breezeway webhook missing raw body — cannot verify');
      return { received: false };
    }

    // Verify HMAC over the RAW body bytes (re-serializing changes whitespace
    // and breaks the signature).
    if (
      !this.breezeWayService.validateWebhookSignature(req.rawBody, signature)
    ) {
      this.logger.warn('Invalid Breezeway webhook signature');
      return { received: false };
    }

    let body: any;
    try {
      body = JSON.parse(req.rawBody.toString('utf8'));
    } catch {
      this.logger.warn('Breezeway webhook body is not valid JSON');
      return { received: false };
    }

    this.logger.log(`Breezeway webhook received: ${body.event}`);

    try {
      if (body.event === 'task.completed') {
        const taskId = body.data.id;
        const photoUrl = body.data.completion_photo_url;
        const staffName = body.data.completed_by_name;

        const request =
          await this.requestsService.findByBreezeWayTaskId(taskId);

        if (request) {
          await this.requestsService.markReady(request.id, photoUrl, staffName);
          this.logger.log(`Request ${request.id} marked as READY`);
        }
      }

      if (body.event === 'task.started') {
        const taskId = body.data.id;
        const request =
          await this.requestsService.findByBreezeWayTaskId(taskId);
        if (request) {
          this.logger.log(`Task started for request ${request.id}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error processing Breezeway webhook: ${error.message}`);
    }

    return { received: true };
  }
}
