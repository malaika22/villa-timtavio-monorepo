import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFolioItemDto } from './dto/create-folio-item.dto';

@Injectable()
export class FolioService {
  private readonly logger = new Logger(FolioService.name);

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

    await this.pusherService.bookingCheckedOut(bookingId, {
      grandTotal: summary.grandTotal,
      chargedAt: new Date().toISOString(),
    });

    return { success: true, grandTotal: summary.grandTotal, captured };
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
