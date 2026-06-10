import {
  Controller,
  Post,
  HttpCode,
  Logger,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import Stripe from 'stripe';

type StripeWebhookEvent = ReturnType<
  InstanceType<typeof Stripe>['webhooks']['constructEvent']
>;

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-05-27.dahlia',
  });

  @Post()
  @Public()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: StripeWebhookEvent;

    if (!req.rawBody) {
      throw new Error('Missing raw request body');
    }

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature failed: ${err.message}`);
      return { received: false };
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        this.logger.log(`Payment succeeded: ${(event.data.object as any).id}`);
        break;
      case 'payment_intent.payment_failed':
        this.logger.error(`Payment failed: ${(event.data.object as any).id}`);
        break;
    }

    return { received: true };
  }
}
