import { Module } from '@nestjs/common';
import { LodgifyWebhookController } from './lodgify.webhook';
import { BreezeWayWebhookController } from './breezeway.webhook';
import { StripeWebhookController } from './stripe.webhook';
import { LodgifyModule } from '../lodgify/lodgify.module';
import { BreezeWayModule } from '../breezeway/breezeway.module';
import { RequestsModule } from '../requests/requests.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [LodgifyModule, BreezeWayModule, RequestsModule, BookingsModule],
  controllers: [
    LodgifyWebhookController,
    BreezeWayWebhookController,
    StripeWebhookController,
  ],
})
export class WebhooksModule {}
