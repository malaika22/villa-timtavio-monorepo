import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  SittingTimes,
  DiningLateArrival,
  AddLateArrivalDto,
} from './dining.types';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService, PUSHER_CHANNELS } from '../pusher/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDiningRequestDto } from './dto/create-dining-request.dto';

const SETTINGS_SINGLETON = 'singleton';
const EMPTY_SITTING_TIMES: SittingTimes = {
  BREAKFAST: [],
  LUNCH: [],
  DINNER: [],
};

@Injectable()
export class DiningService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
    private notifications: NotificationsService,
  ) {}

  async findByBooking(bookingId: string) {
    return this.prisma.diningRequest.findMany({
      where: { bookingId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    bookingId: string,
    dto: CreateDiningRequestDto,
    requestedBy: { email: string; name: string; tier?: string | null },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Only the primary member sets the main sitting times — secondary guests
    // are accommodated as late arrivals against the primary's sitting instead.
    if (dto.kind === 'SITTING' && requestedBy.tier === 'secondary') {
      throw new ForbiddenException(
        'Only the primary member can reserve a sitting. You can flag a late arrival on the primary’s sitting instead.',
      );
    }

    if (dto.kind === 'SITTING' && (!dto.mealType || !dto.date || !dto.time)) {
      throw new BadRequestException(
        'A sitting requires a meal, date and time.',
      );
    }
    if (dto.kind === 'ORDER' && (!dto.items || dto.items.length === 0)) {
      throw new BadRequestException('An order requires at least one item.');
    }

    const created = await this.prisma.diningRequest.create({
      data: {
        bookingId,
        requestedByEmail: requestedBy.email,
        requestedByName: requestedBy.name,
        kind: dto.kind,
        mealType: dto.mealType,
        date: dto.date ? new Date(dto.date) : undefined,
        time: dto.time,
        partySize: dto.partySize,
        allergies: dto.allergies,
        specialRequests: dto.specialRequests,
        items: (dto.items as unknown as Prisma.InputJsonValue) ?? undefined,
        requestedFor: dto.requestedFor,
        notes: dto.notes,
      },
    });

    // Notify the estate manager dashboard in real time.
    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'dining.requested', {
      id: created.id,
      bookingId,
      kind: created.kind,
      guestName: requestedBy.name,
      mealType: created.mealType,
    });

    return created;
  }

  async confirm(id: string) {
    const request = await this.ensureExists(id);

    const updated = await this.prisma.diningRequest.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    // The guest asked for a table and heard nothing back — dining used to
    // change status silently while every experience step notified. From the
    // guest's side that is indistinguishable from being ignored.
    await this.notifyRequester(updated, {
      type: 'REQUEST_CONFIRMED',
      title: this.isSitting(updated) ? 'Your table is confirmed' : 'Your order is confirmed',
      body: this.describe(updated),
    });

    return updated;
  }

  /**
   * @param cancelledBy the email of whoever cancelled, when known. A guest who
   * cancels their own request already knows; telling them again is noise.
   */
  async cancel(id: string, cancelledBy?: string) {
    const request = await this.ensureExists(id);

    const updated = await this.prisma.diningRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    const cancelledThemselves =
      !!cancelledBy &&
      cancelledBy.toLowerCase() === request.requestedByEmail.toLowerCase();

    if (!cancelledThemselves) {
      await this.notifyRequester(updated, {
        type: 'REQUEST_CANCELLED',
        title: this.isSitting(updated) ? 'Your table was cancelled' : 'Your order was cancelled',
        body: `${this.describe(updated)} — please speak to your concierge if this is unexpected.`,
      });
    }

    // The EM's own list needs to lose a guest-cancelled row without a refresh.
    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'dining.cancelled', {
      id: updated.id,
      bookingId: updated.bookingId,
    });

    return updated;
  }

  private isSitting(request: { kind: string }) {
    return request.kind === 'SITTING';
  }

  /** A line a guest would recognise as their own request. */
  private describe(request: {
    kind: string;
    mealType?: string | null;
    date?: Date | null;
    time?: string | null;
    partySize?: number | null;
    items?: unknown;
  }): string {
    if (this.isSitting(request)) {
      const meal = request.mealType
        ? request.mealType.charAt(0) + request.mealType.slice(1).toLowerCase()
        : 'Sitting';
      const when = request.date
        ? request.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '';
      const parts = [meal, when, request.time].filter(Boolean).join(' · ');
      return request.partySize ? `${parts} · ${request.partySize} guests` : parts;
    }

    const items = Array.isArray(request.items) ? request.items : [];
    const count = items.reduce(
      (sum: number, i: unknown) =>
        sum + Number((i as { quantity?: number })?.quantity ?? 1),
      0,
    );
    return `${count} item${count === 1 ? '' : 's'}`;
  }

  private async notifyRequester(
    request: {
      id: string;
      bookingId: string;
      requestedByEmail: string;
      kind: string;
    },
    notice: { type: 'REQUEST_CONFIRMED' | 'REQUEST_CANCELLED'; title: string; body: string },
  ) {
    await this.notifications.send({
      bookingId: request.bookingId,
      recipientEmail: request.requestedByEmail,
      type: notice.type,
      title: notice.title,
      body: notice.body,
      deepLink: '/dining',
    });

    // And live, so an open app updates without the guest pulling to refresh.
    await this.pusher.trigger(
      PUSHER_CHANNELS.guestBooking(request.bookingId),
      'dining.status',
      { id: request.id, status: notice.type === 'REQUEST_CONFIRMED' ? 'CONFIRMED' : 'CANCELLED' },
    );
  }

  /**
   * Everything awaiting the estate's attention, across every booking.
   *
   * Dining requests only ever surfaced on a booking's own detail page, so one
   * nobody happened to open was one nobody answered. Ordered by when the meal
   * is, not when it was asked for — a breakfast tomorrow outranks a dinner next
   * week however late it came in.
   */
  async getQueue() {
    const requests = await this.prisma.diningRequest.findMany({
      where: { status: 'REQUESTED' },
      include: {
        booking: { include: { primaryGuest: true } },
      },
    });

    const at = (r: (typeof requests)[number]) =>
      r.date ? r.date.getTime() : r.createdAt.getTime();

    return requests.sort((a, b) => at(a) - at(b));
  }

  // ─── Recommended sitting times (estate-configured) ────────────────────────

  async getSittingTimes(): Promise<SittingTimes> {
    const settings = await this.prisma.estateSettings.findUnique({
      where: { id: SETTINGS_SINGLETON },
      select: { sittingTimes: true },
    });
    return this.normalizeSittingTimes(settings?.sittingTimes);
  }

  async updateSittingTimes(dto: SittingTimes): Promise<SittingTimes> {
    const value = this.normalizeSittingTimes(dto);
    await this.prisma.estateSettings.upsert({
      where: { id: SETTINGS_SINGLETON },
      create: {
        id: SETTINGS_SINGLETON,
        sittingTimes: value as unknown as Prisma.InputJsonValue,
      },
      update: { sittingTimes: value as unknown as Prisma.InputJsonValue },
    });
    return value;
  }

  /** Coerce arbitrary JSON into a well-formed SittingTimes (sorted, deduped). */
  private normalizeSittingTimes(raw: unknown): SittingTimes {
    const src = (raw ?? {}) as Record<string, unknown>;
    const clean = (v: unknown): string[] =>
      Array.isArray(v)
        ? [...new Set(v.filter((t): t is string => typeof t === 'string'))].sort()
        : [];
    return {
      BREAKFAST: clean(src.BREAKFAST),
      LUNCH: clean(src.LUNCH),
      DINNER: clean(src.DINNER),
    };
  }

  // ─── Late arrivals (secondary guests) ─────────────────────────────────────

  async addLateArrival(
    id: string,
    by: { email: string; name: string },
    dto: AddLateArrivalDto,
    at: string,
  ) {
    const sitting = await this.ensureExists(id);
    if (sitting.kind !== 'SITTING') {
      throw new BadRequestException(
        'Late arrivals can only be flagged on a sitting.',
      );
    }

    const existing = Array.isArray(sitting.lateArrivals)
      ? (sitting.lateArrivals as unknown as DiningLateArrival[])
      : [];
    // One flag per guest — replace an earlier one from the same email.
    const next: DiningLateArrival[] = [
      ...existing.filter((l) => l.email !== by.email),
      {
        email: by.email,
        name: by.name,
        note: dto.note?.trim() || null,
        allergies: dto.allergies?.trim() || null,
        at,
      },
    ];

    const updated = await this.prisma.diningRequest.update({
      where: { id },
      data: {
        lateArrivals: next as unknown as Prisma.InputJsonValue,
      },
    });

    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'dining.late', {
      id,
      bookingId: sitting.bookingId,
      guestName: by.name,
    });

    return updated;
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.diningRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Dining request not found');
    return found;
  }
}
