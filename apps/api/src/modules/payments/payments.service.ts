import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Stripe payments — deposit hold at booking + capture at checkout.
 * Fully guarded: every method no-ops cleanly when STRIPE_SECRET_KEY is unset
 * so dev/test flows still complete.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly key = process.env.STRIPE_SECRET_KEY;
  private readonly isTest = (this.key ?? '').startsWith('sk_test_');

  constructor(private prisma: PrismaService) {}

  private client() {
    if (!this.key) return null;
    return new Stripe(this.key);
  }

  /**
   * Places a manual-capture authorization (the "50% deposit hold") on the
   * booking. Idempotent — returns early if a payment intent already exists.
   * In test mode it confirms with a Stripe test card so the hold is
   * immediately capturable; in live mode it creates the intent for the real
   * card flow to confirm.
   */
  async createDepositHold(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.stripePaymentIntentId) {
      return { skipped: true, reason: 'already-held' as const };
    }

    const stay = Number(booking.baseRate) || 0;
    const deposit = Math.round(stay * 0.5 * 100) / 100; // 50% deposit
    if (deposit <= 0) return { skipped: true, reason: 'zero-amount' as const };

    const stripe = this.client();
    if (!stripe) {
      // No Stripe configured — record the intended deposit only.
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { stripeDepositAmount: deposit },
      });
      this.logger.warn(`Stripe not configured — recorded deposit only for ${bookingId}`);
      return { skipped: true, reason: 'no-stripe' as const, deposit };
    }

    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(deposit * 100),
        currency: 'usd',
        capture_method: 'manual',
        metadata: { bookingId },
        ...(this.isTest
          ? { confirm: true, payment_method: 'pm_card_visa' }
          : {}),
      });

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          stripePaymentIntentId: intent.id,
          stripeDepositAmount: deposit,
          stripeDepositCaptured: false,
        },
      });

      this.logger.log(
        `Deposit hold ${intent.id} (${intent.status}) placed for ${bookingId}`,
      );
      return { paymentIntentId: intent.id, status: intent.status, deposit };
    } catch (err) {
      this.logger.error(`Deposit hold failed for ${bookingId}: ${String(err)}`);
      // Best-effort — don't block booking creation on a payment hold.
      return { skipped: true, reason: 'error' as const, error: String(err) };
    }
  }

  /**
   * Captures the booking's deposit PaymentIntent for the final total.
   * Returns true on a real capture, false when Stripe / the intent is absent.
   * Throws on a genuine capture failure so checkout doesn't silently succeed.
   */
  async captureDeposit(
    paymentIntentId: string | null,
    grandTotal: number,
  ): Promise<boolean> {
    const stripe = this.client();
    if (!stripe || !paymentIntentId) return false;

    await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: Math.round(grandTotal * 100),
    });
    return true;
  }
}
