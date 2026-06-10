// apps/api/src/webhooks/lodgify.webhook.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { LodgifyService } from '../lodgify/lodgify.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('webhooks/lodgify')
export class LodgifyWebhookController {
  private readonly logger = new Logger(LodgifyWebhookController.name);

  constructor(
    private lodgifyService: LodgifyService,
    private bookingsService: BookingsService,
  ) {}

  @Post()
  @Public()
  @HttpCode(200)
  async handle(@Body() body: any, @Headers() headers: any) {
    const signature = headers['x-lodgify-signature'];

    if (
      !this.lodgifyService.validateWebhookSignature(
        JSON.stringify(body),
        signature,
      )
    ) {
      this.logger.warn('Invalid Lodgify webhook signature');
      return { received: false };
    }

    this.logger.log(`Lodgify webhook received: ${body.event}`);

    try {
      switch (body.event) {
        case 'reservation.created':
          await this.bookingsService.syncFromLodgify(body.data);
          break;
        case 'reservation.updated':
          await this.bookingsService.updateFromLodgify(body.data);
          break;
        case 'reservation.cancelled':
          await this.bookingsService.cancelFromLodgify(body.data);
          break;
        default:
          this.logger.log(`Unhandled Lodgify event: ${body.event}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing Lodgify webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return { received: true };
  }
}
