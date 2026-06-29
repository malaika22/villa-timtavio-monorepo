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
import { PrismaService } from '../../prisma/prisma.service';

type StripeWebhookEvent = ReturnType<
  InstanceType<typeof Stripe>['webhooks']['constructEvent']
>;

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private prisma: PrismaService) {}

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
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; metadata?: Record<string, string> };
        const bookingId = pi.metadata?.bookingId;
        this.logger.log(`Payment succeeded: ${pi.id} (booking ${bookingId})`);
        if (bookingId) {
          await this.prisma.booking
            .update({
              where: { id: bookingId },
              data: {
                stripeDepositCaptured: true,
                stripeCapturedAt: new Date(),
                stripePaymentIntentId: pi.id,
              },
            })
            .catch((err) =>
              this.logger.error(`Booking update failed: ${String(err)}`),
            );
          await this.prisma.auditLog.create({
            data: {
              action: 'PAYMENT_CAPTURED',
              entityType: 'Booking',
              entityId: bookingId,
              performedBy: 'stripe-webhook',
              performedByRole: 'system',
              bookingId,
            },
          });
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; metadata?: Record<string, string> };
        const bookingId = pi.metadata?.bookingId;
        this.logger.error(`Payment failed: ${pi.id} (booking ${bookingId})`);
        if (bookingId) {
          await this.prisma.auditLog.create({
            data: {
              action: 'PAYMENT_FAILED',
              entityType: 'Booking',
              entityId: bookingId,
              performedBy: 'stripe-webhook',
              performedByRole: 'system',
              bookingId,
            },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}
