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
        primaryGuest: true,
        folioItems: {
          orderBy: { createdAt: 'desc' },
          include: { experienceRequest: { include: { catalogItem: true } } },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Prisma hands Decimal columns back as objects that serialise to STRINGS,
    // while FolioItem.amount is typed `number`. Anything summing them
    // client-side concatenated instead of adding — "200" + "1200" + "1400"
    // showed a guest $20,012,001,400 of experiences. Coerce once, here, so the
    // response matches the contract it declares and no caller has to know.
    const items = booking.folioItems.map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    const subtotal = booking.folioItems.reduce(
      (sum, item) => sum + Number(item.amount) * item.quantity,
      0,
    );

    const taxAmount = subtotal * Number(booking.taxRate);
    const serviceAmount = subtotal * Number(booking.serviceChargeRate);
    const grandTotal = subtotal + taxAmount + serviceAmount;

    // Group by type
    const byType = {
      ESTATE_BASE_RATE: items.filter((i) => i.type === 'ESTATE_BASE_RATE'),
      PRE_STOCKED: items.filter((i) => i.type === 'PRE_STOCKED'),
      EXPERIENCE: items.filter((i) => i.type === 'EXPERIENCE'),
      INCIDENTAL: items.filter((i) => i.type === 'INCIDENTAL'),
    };

    return {
      booking,
      items,
      byType,
      byGuest: this.groupByGuest(
        items,
        booking.primaryGuest.email,
        `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`.trim(),
      ),
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

  /**
   * Spend per party member, so the primary — who is billed for the whole folio —
   * can see what each guest ran up and settle with them independently.
   *
   * Deliberately financial only: zero-amount lines (included experiences) are
   * left out. Charges with no attribution (the villa base rate, incidentals the
   * EM didn't assign) fall to the primary, who is liable for them — that also
   * keeps the guest totals reconciling exactly to the pre-tax subtotal.
   */
  private groupByGuest(
    items: {
      id: string;
      description: string;
      type: string;
      amount: number;
      quantity: number;
      loggedAt: Date;
      attributedToEmail?: string | null;
      attributedToName?: string | null;
    }[],
    primaryEmail: string,
    primaryName: string,
  ) {
    type Line = {
      id: string;
      description: string;
      type: string;
      quantity: number;
      total: number;
      loggedAt: Date;
    };
    const buckets = new Map<
      string,
      {
        email: string;
        name: string;
        isPrimary: boolean;
        total: number;
        itemCount: number;
        items: Line[];
      }
    >();

    for (const item of items) {
      const total = Number(item.amount) * item.quantity;
      if (!total) continue; // included / free — nothing to charge back

      const email = item.attributedToEmail || primaryEmail;
      const isPrimary = email === primaryEmail;
      const name = isPrimary
        ? primaryName
        : item.attributedToName || item.attributedToEmail || 'Guest';

      const bucket = buckets.get(email) ?? {
        email,
        name,
        isPrimary,
        total: 0,
        itemCount: 0,
        items: [],
      };
      bucket.total += total;
      bucket.itemCount += 1;
      // The charges behind the figure. A total on its own is unverifiable —
      // "Sara · $3,600" tells the primary nothing about what to settle for.
      bucket.items.push({
        id: item.id,
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        total: Math.round(total * 100) / 100,
        loggedAt: item.loggedAt,
      });
      buckets.set(email, bucket);
    }

    // Primary first, then the biggest spenders.
    return Array.from(buckets.values())
      .map((b) => ({ ...b, total: Math.round(b.total * 100) / 100 }))
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return b.total - a.total;
      });
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

    const row = (label: string, value: string) =>
      `<tr>
         <td style="padding:9px 0;color:#8a8178;font-size:14px;font-family:Helvetica,Arial,sans-serif">${label}</td>
         <td align="right" style="padding:9px 0;color:#2b2824;font-size:14px;font-family:Helvetica,Arial,sans-serif">${value}</td>
       </tr>`;

    await this.resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'reservations@villatimtavio.com',
      to,
      subject: 'Your Villa TimTavio receipt',
      html: `
      <div style="margin:0;padding:0;background:#f3efe8;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe8;padding:32px 12px;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eae4da;">
              <!-- Brand header -->
              <tr>
                <td style="background:#0f1f2e;padding:28px 36px;text-align:center;">
                  <div style="font-family:Georgia,'Times New Roman',serif;color:#ffffff;font-size:20px;letter-spacing:6px;">VILLA&nbsp;TIMTAVIO</div>
                  <div style="height:2px;width:40px;background:#c8a96e;margin:12px auto 0;"></div>
                  <div style="font-family:Helvetica,Arial,sans-serif;color:#c8a96e;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-top:12px;">Receipt</div>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 36px 8px;">
                  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:26px;color:#1a1614;">Thank you, ${guestName}</h1>
                  <p style="margin:10px 0 0;font-family:Helvetica,Arial,sans-serif;color:#8a8178;font-size:14px;line-height:1.6;">Your stay has been settled — here is your receipt.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 36px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${row('Subtotal', money(summary.subtotal))}
                    ${row('Tax', money(summary.taxAmount))}
                    ${row('Service', money(summary.serviceAmount))}
                    <tr><td colspan="2" style="border-top:1px solid #eae4da;font-size:0;line-height:0;">&nbsp;</td></tr>
                    <tr>
                      <td style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;color:#1a1614;font-size:17px;">Total charged</td>
                      <td align="right" style="padding:14px 0 0;font-family:Georgia,'Times New Roman',serif;color:#0f1f2e;font-size:18px;font-weight:600;">${money(summary.grandTotal)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:32px 36px 34px;">
                  <div style="border-top:1px solid #eae4da;padding-top:20px;font-family:Helvetica,Arial,sans-serif;color:#b3aaa0;font-size:12px;line-height:1.6;text-align:center;">
                    Villa TimTavio &nbsp;·&nbsp; We hope to welcome you again.
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
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
