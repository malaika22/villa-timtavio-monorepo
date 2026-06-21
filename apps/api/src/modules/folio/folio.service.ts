import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
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
    const { summary, booking } = await this.getForBooking(bookingId);

    // Update booking status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        stripeCheckoutAmount: summary.grandTotal,
        stripeCapturedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CHECKOUT_TRIGGERED',
        entityType: 'Booking',
        entityId: bookingId,
        performedBy: triggeredBy,
        performedByRole: 'estate_manager',
        bookingId,
        metadata: { grandTotal: summary.grandTotal } as any,
      },
    });

    await this.pusherService.bookingCheckedOut(bookingId, {
      grandTotal: summary.grandTotal,
      chargedAt: new Date().toISOString(),
    });

    return { success: true, grandTotal: summary.grandTotal };
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
