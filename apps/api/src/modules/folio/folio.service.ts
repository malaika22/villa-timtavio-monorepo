import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFolioItemDto } from './dto/create-folio-item.dto';

@Injectable()
export class FolioService {
  private readonly logger = new Logger(FolioService.name);
  private readonly resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  constructor(
    private prisma: PrismaService,
    private pusherService: PusherService,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Get folio for a booking ──────────────────────────────────────────────────

  async getForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        folioItems: {
          orderBy: { createdAt: 'desc' },
          include: { experienceRequest: { include: { catalogItem: true } } },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const subtotal = booking.folioItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );

    const taxAmount = subtotal * Number(booking.taxRate);
    const serviceAmount = subtotal * Number(booking.serviceChargeRate);
    const grandTotal = subtotal + taxAmount + serviceAmount;

    // Group by type
    const byType = {
      ESTATE_BASE_RATE: booking.folioItems.filter(
        (i) => i.type === 'ESTATE_BASE_RATE',
      ),
      PRE_STOCKED: booking.folioItems.filter((i) => i.type === 'PRE_STOCKED'),
      EXPERIENCE: booking.folioItems.filter((i) => i.type === 'EXPERIENCE'),
      INCIDENTAL: booking.folioItems.filter((i) => i.type === 'INCIDENTAL'),
    };

    return {
      booking,
      items: booking.folioItems,
      byType,
      summary: {
        subtotal,
        taxRate: booking.taxRate,
        taxAmount,
        serviceChargeRate: booking.serviceChargeRate,
        serviceAmount,
        grandTotal,
      },
    };
  }

  // ─── Log a charge ─────────────────────────────────────────────────────────────

  async logCharge(
    bookingId: string,
    dto: CreateFolioItemDto,
    loggedBy: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const item = await this.prisma.folioItem.create({
      data: {
        bookingId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        quantity: dto.quantity || 1,
        attributedToEmail: dto.attributedToEmail,
        attributedToName: dto.attributedToName,
        staffNote: dto.staffNote,
        loggedBy,
        loggedAt: new Date(),
        editableUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min edit window
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'FOLIO_CHARGE_ADDED',
        entityType: 'FolioItem',
        entityId: item.id,
        performedBy: loggedBy,
        performedByRole: 'estate_manager',
        bookingId,
        afterState: item as any,
        metadata: { staffNote: dto.staffNote } as any,
      },
    });

    const total = Number(dto.amount) * (dto.quantity || 1);

    await this.notificationsService.send({
      bookingId,
      recipientEmail: booking.primaryGuest.email,
      type: 'CHARGE_ADDED',
      title: 'New charge added',
      body: `$${total.toFixed(2)} — ${dto.description}`,
      deepLink: '/folio',
    });

    await this.pusherService.folioUpdated(bookingId, {
      newItem: {
        id: item.id,
        description: dto.description,
        amount: dto.amount,
        quantity: dto.quantity || 1,
        total: Number(dto.amount) * (dto.quantity || 1),
        type: dto.type,
      },
    });

    return item;
  }

  // ─── Edit charge (within 30-min window) ──────────────────────────────────────

  async editCharge(
    itemId: string,
    data: { description?: string; amount?: number },
    editedBy: string,
  ) {
    const item = await this.prisma.folioItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Folio item not found');

    if (new Date() > item.editableUntil) {
      throw new ForbiddenException('Edit window has expired. Contact support.');
    }

    const before = { ...item };
    const updated = await this.prisma.folioItem.update({
      where: { id: itemId },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'FOLIO_CHARGE_EDITED',
        entityType: 'FolioItem',
        entityId: itemId,
        performedBy: editedBy,
        performedByRole: 'estate_manager',
        bookingId: item.bookingId,
        beforeState: before as any,
        afterState: updated as any,
      },
    });

    return updated;
  }

  // ─── Trigger checkout ─────────────────────────────────────────────────────────

  async checkout(bookingId: string, triggeredBy: string) {
    const { summary } = await this.getForBooking(bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CHECKED_OUT') {
      throw new BadRequestException('Booking is already checked out');
    }

    // Capture the deposit hold via Stripe when configured. In dev (no keys /
    // no payment intent) this is a no-op so the flow still completes.
    const captured = await this.capturePayment(
      booking.stripePaymentIntentId,
      summary.grandTotal,
      bookingId,
      triggeredBy,
    );

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        stripeCheckoutAmount: summary.grandTotal,
        stripeCapturedAt: new Date(),
        stripeDepositCaptured: captured || booking.stripeDepositCaptured,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: captured ? 'PAYMENT_CAPTURED' : 'CHECKOUT_TRIGGERED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: triggeredBy,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: { grandTotal: summary.grandTotal, captured } as any,
      },
    });

    // Receipt to the primary member (in-app; email is best-effort elsewhere).
    await this.notificationsService
      .send({
        bookingId,
        recipientEmail: booking.primaryGuest.email,
        type: 'CHARGE_ADDED',
        title: 'Checkout complete',
        body: `Your stay total of $${summary.grandTotal.toLocaleString()} has been settled. A receipt has been sent to your email.`,
        deepLink: '/folio',
      })
      .catch((err) =>
        this.logger.error(`Receipt notification failed: ${String(err)}`),
      );

    // Receipt email to the primary member (best-effort; guarded by RESEND key).
    await this.sendReceiptEmail(
      booking.primaryGuest.email,
      `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`,
      summary,
    ).catch((err) =>
      this.logger.error(`Receipt email failed: ${String(err)}`),
    );

    await this.pusherService.bookingCheckedOut(bookingId, {
      grandTotal: summary.grandTotal,
      chargedAt: new Date().toISOString(),
    });

    return { success: true, grandTotal: summary.grandTotal, captured };
  }

  private async sendReceiptEmail(
    to: string,
    guestName: string,
    summary: {
      subtotal: number;
      taxAmount: number;
      serviceAmount: number;
      grandTotal: number;
    },
  ) {
    if (!this.resend) return;
    const money = (n: number) =>
      `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    await this.resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'reservations@villatimtavio.com',
      to,
      subject: 'Your Villa TimTavio receipt',
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2b2824">
          <h2 style="font-weight:normal">Thank you, ${guestName}</h2>
          <p style="color:#6b6661">Your stay has been settled. Here is your receipt.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:6px 0;color:#6b6661">Subtotal</td><td style="text-align:right">${money(summary.subtotal)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6661">Tax</td><td style="text-align:right">${money(summary.taxAmount)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6661">Service</td><td style="text-align:right">${money(summary.serviceAmount)}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #e8e4de;font-weight:bold">Total charged</td><td style="text-align:right;padding-top:10px;border-top:1px solid #e8e4de;font-weight:bold">${money(summary.grandTotal)}</td></tr>
          </table>
          <p style="color:#9a9288;font-size:12px;margin-top:24px">Villa TimTavio · We hope to welcome you again.</p>
        </div>
      `,
    });
  }

  /**
   * Captures the booking's deposit PaymentIntent for the final total. Returns
   * true when a real capture happened, false when Stripe isn't configured (dev).
   * Throws on a genuine capture failure so checkout doesn't silently succeed.
   */
  private async capturePayment(
    paymentIntentId: string | null,
    grandTotal: number,
    bookingId: string,
    triggeredBy: string,
  ): Promise<boolean> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !paymentIntentId) {
      this.logger.warn(
        `Stripe not configured or no payment intent for ${bookingId} — skipping capture`,
      );
      return false;
    }

    try {
      const stripe = new Stripe(key);
      await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: Math.round(grandTotal * 100),
      });
      return true;
    } catch (err) {
      await this.prisma.auditLog.create({
        data: {
          action: 'PAYMENT_FAILED',
          entityType: 'Booking',
          entityId: bookingId,
          performedBy: triggeredBy,
          performedByRole: 'estate_manager',
          bookingId,
          metadata: { grandTotal, error: String(err) } as any,
        },
      });
      this.logger.error(`Stripe capture failed for ${bookingId}: ${String(err)}`);
      throw new BadRequestException(
        'Payment capture failed — the card was not charged. Please retry.',
      );
    }
  }

  async getDailyRevenue() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const result = await this.prisma.folioItem.aggregate({
      where: {
        loggedAt: { gte: todayStart, lt: todayEnd },
      },
      _sum: { amount: true },
    });

    return {
      total: Number(result._sum.amount ?? 0),
      currency: 'USD',
      date: todayStart.toISOString(),
    };
  }
}
