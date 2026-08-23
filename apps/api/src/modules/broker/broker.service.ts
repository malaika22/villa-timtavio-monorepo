import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BrokerHoldStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LodgifyService } from '../lodgify/lodgify.service';
import { CreateBrokerHoldDto } from './dto/create-broker-hold.dto';
import {
  AvailabilityNight,
  AvailabilityWindow,
  DEFAULT_MIN_NIGHTS,
  HOLD_HOURS,
  MAX_HOLD_NIGHTS,
  MAX_HORIZON_DAYS,
  NightStatus,
} from './broker.types';

/** YYYY-MM-DD, timezone-free — the estate's calendar deals in plain dates. */
const day = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Parse YYYY-MM-DD as local midnight, never as UTC. */
const atMidnight = (s: string): Date => new Date(`${s.slice(0, 10)}T00:00:00`);

const addDays = (d: Date, n: number): Date => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

const todayMidnight = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

@Injectable()
export class BrokerService {
  private readonly logger = new Logger(BrokerService.name);

  constructor(
    private prisma: PrismaService,
    private lodgify: LodgifyService,
  ) {}

  // ─── Availability ─────────────────────────────────────────────────────────

  /**
   * What a broker sees: every night in the window, whether it can be sold, and
   * what it costs.
   *
   * Three sources are layered, in this order of authority:
   *   1. Lodgify — what is actually sold, blocked or under maintenance.
   *   2. Our own live holds — nights another broker has claimed.
   *   3. Rates: Lodgify's where it has them, the estate's season table where
   *      it doesn't, and nothing at all where neither does.
   */
  async availability(fromRaw?: string, toRaw?: string): Promise<AvailabilityWindow> {
    const from = fromRaw ? atMidnight(fromRaw) : todayMidnight();
    const to = toRaw ? atMidnight(toRaw) : addDays(from, 90);

    if (!(from < to)) {
      throw new BadRequestException('`to` must be after `from`');
    }
    const span = Math.round((+to - +from) / 86_400_000);
    if (span > MAX_HORIZON_DAYS) {
      throw new BadRequestException(
        `Ask for at most ${MAX_HORIZON_DAYS} days at a time`,
      );
    }

    const [blocked, rates, held] = await Promise.all([
      this.lodgify.getUnavailableNights(from, to),
      this.lodgify.getRateCalendar(from, to),
      this.heldNights(from, to),
    ]);

    // No currency, no prices. A number without one is only meaningful if you
    // already know whether the estate prices in dollars or pesos, and a broker
    // reading it will assume whichever their last villa used.
    const currency = rates.currency;
    const priced = currency != null;

    const today = todayMidnight();
    const nights: AvailabilityNight[] = [];
    let sawRate = false;

    for (let c = new Date(from); c < to; c = addDays(c, 1)) {
      const date = day(c);

      // A night already past is not "open" in any useful sense, and offering
      // it invites a hold nobody can honour.
      let status: NightStatus = 'OPEN';
      if (c < today || blocked.has(date)) status = 'TAKEN';
      else if (held.has(date)) status = 'HELD';

      const night = rates.nights.get(date);
      const rate = priced && night ? night.rate : null;
      if (rate != null) sawRate = true;

      nights.push({
        date,
        status,
        rate,
        // Lodgify's minimum when it has one for this date, ours otherwise.
        // The estate sets stay rules where it sets prices; this constant is
        // only what we assume until it hears from them.
        minNights: night?.minStay ?? DEFAULT_MIN_NIGHTS,
      });
    }

    return {
      from: day(from),
      to: day(to),
      nights,
      rateSource: sawRate ? 'lodgify' : 'none',
      currency,
      holdHours: HOLD_HOURS,
    };
  }

  // ─── Holds ────────────────────────────────────────────────────────────────

  /**
   * Places a 48-hour claim on a range.
   *
   * Everything is re-checked here rather than trusted from the page. The
   * calendar the broker was looking at may be a minute old, and the estimate
   * it showed them is a number we recompute — a client-supplied price is a
   * price anyone can choose.
   */
  async createHold(dto: CreateBrokerHoldDto) {
    const checkIn = atMidnight(dto.checkIn);
    const checkOut = atMidnight(dto.checkOut);

    if (!(checkIn < checkOut)) {
      throw new BadRequestException('Departure must be after arrival');
    }
    if (checkIn < todayMidnight()) {
      throw new BadRequestException('That arrival date has passed');
    }

    const nights = Math.round((+checkOut - +checkIn) / 86_400_000);
    if (nights > MAX_HOLD_NIGHTS) {
      throw new BadRequestException(
        `A hold can cover at most ${MAX_HOLD_NIGHTS} nights`,
      );
    }

    const window = await this.availability(day(checkIn), day(checkOut));

    const unavailable = window.nights.filter((n) => n.status !== 'OPEN');
    if (unavailable.length > 0) {
      throw new BadRequestException(
        unavailable.some((n) => n.status === 'HELD')
          ? 'Someone has just held part of those dates. Please pick again.'
          : 'Part of those dates has just been taken. Please pick again.',
      );
    }

    const minNights = window.nights[0]?.minNights ?? DEFAULT_MIN_NIGHTS;
    if (nights < minNights) {
      throw new BadRequestException(
        `That season has a ${minNights}-night minimum.`,
      );
    }

    // Priced per night so a range crossing a season boundary totals honestly.
    // Left null if any night is unpriced: a partial total reads as a full one
    // and would understate the stay to a broker about to quote it.
    const priced = window.nights.every((n) => n.rate != null);
    const estimatedTotal = priced
      ? window.nights.reduce((sum, n) => sum + (n.rate ?? 0), 0)
      : null;

    const hold = await this.prisma.brokerHold.create({
      data: {
        brokerName: dto.brokerName.trim(),
        brokerEmail: dto.brokerEmail.trim().toLowerCase(),
        brokerAgency: dto.brokerAgency?.trim() || null,
        guestCount: dto.guestCount,
        checkIn,
        checkOut,
        nights,
        estimatedTotal:
          estimatedTotal == null ? null : new Prisma.Decimal(estimatedTotal),
        estimateSource: estimatedTotal == null ? null : window.rateSource,
        expiresAt: new Date(Date.now() + HOLD_HOURS * 3_600_000),
        note: dto.note?.trim() || null,
      },
    });

    this.logger.log(
      `Hold ${hold.id}: ${dto.brokerName} took ${day(checkIn)}→${day(checkOut)} (${nights}n, ${dto.guestCount} guests)`,
    );

    return hold;
  }

  /** The estate's queue. Live holds first, then whatever was resolved lately. */
  async listHolds() {
    await this.sweepExpired();

    return this.prisma.brokerHold.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'CONFIRMED' },
          // Resolved holds stay visible briefly so the estate can see what it
          // just did, and what lapsed while nobody was looking.
          { createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } },
        ],
      },
      orderBy: [{ status: 'asc' }, { checkIn: 'asc' }],
      take: 100,
    });
  }

  async confirmHold(id: string, by: string) {
    const hold = await this.requirePending(id);

    return this.prisma.brokerHold.update({
      where: { id: hold.id },
      data: {
        status: BrokerHoldStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedBy: by,
      },
    });
  }

  async releaseHold(id: string, by: string, note?: string) {
    const hold = await this.requirePending(id);

    return this.prisma.brokerHold.update({
      where: { id: hold.id },
      data: {
        status: BrokerHoldStatus.RELEASED,
        releasedAt: new Date(),
        releasedBy: by,
        ...(note?.trim() ? { note: note.trim() } : {}),
      },
    });
  }

  /**
   * Removes a hold that came to nothing.
   *
   * Confirmed holds are refused. A confirmed hold is the record of how a
   * booking came about, and if a broker ever says "I held those dates and you
   * gave them away", it is the estate's answer — so the only rows that can go
   * are the ones nobody acted on. Pending is refused too: release it first, so
   * the broker is told rather than finding their claim silently gone.
   */
  async deleteHold(id: string, by: string) {
    const hold = await this.prisma.brokerHold.findUnique({ where: { id } });
    if (!hold) throw new NotFoundException('Hold not found');

    if (hold.status === BrokerHoldStatus.CONFIRMED) {
      throw new BadRequestException(
        'A confirmed hold is part of the booking record and can’t be removed.',
      );
    }
    if (hold.status === BrokerHoldStatus.PENDING) {
      throw new BadRequestException(
        'Release this hold first — the broker should know it’s gone.',
      );
    }

    await this.prisma.brokerHold.delete({ where: { id } });
    this.logger.log(`Hold ${id} (${hold.status}) deleted by ${by}`);
    return { id };
  }

  /**
   * Flips PENDING holds whose clock has run out.
   *
   * Housekeeping only — every read already treats an expired-but-unswept hold
   * as gone (see `heldNights`), so the calendar is correct between runs. This
   * exists so the estate's queue doesn't accumulate rows that pretend to be
   * live.
   */
  async sweepExpired(): Promise<number> {
    const { count } = await this.prisma.brokerHold.updateMany({
      where: { status: 'PENDING', expiresAt: { lte: new Date() } },
      data: { status: BrokerHoldStatus.EXPIRED },
    });

    if (count > 0) this.logger.log(`Expired ${count} broker hold(s)`);
    return count;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async requirePending(id: string) {
    const hold = await this.prisma.brokerHold.findUnique({ where: { id } });
    if (!hold) throw new NotFoundException('Hold not found');

    if (hold.status !== 'PENDING') {
      throw new BadRequestException(
        `That hold is already ${hold.status.toLowerCase()}`,
      );
    }
    // Checked against the clock rather than the stored status: the sweeper may
    // not have run, and confirming a hold that lapsed twenty minutes ago would
    // resurrect a claim the broker has already been told is gone.
    if (hold.expiresAt <= new Date()) {
      await this.prisma.brokerHold.update({
        where: { id },
        data: { status: BrokerHoldStatus.EXPIRED },
      });
      throw new BadRequestException('That hold has expired');
    }

    return hold;
  }

  /** Nights spoken for by a live hold — PENDING and still inside its window. */
  private async heldNights(from: Date, to: Date): Promise<Set<string>> {
    const holds = await this.prisma.brokerHold.findMany({
      where: {
        status: { in: [BrokerHoldStatus.PENDING, BrokerHoldStatus.CONFIRMED] },
        checkIn: { lt: to },
        checkOut: { gt: from },
        // A PENDING hold past its expiry is already gone, whether or not the
        // sweeper has caught up. CONFIRMED holds ignore the clock — the estate
        // has accepted them and they stand until Lodgify carries the booking.
        OR: [
          { status: BrokerHoldStatus.CONFIRMED },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: { checkIn: true, checkOut: true },
    });

    const nights = new Set<string>();
    for (const h of holds) {
      for (let c = new Date(h.checkIn); c < h.checkOut; c = addDays(c, 1)) {
        nights.add(day(c));
      }
    }
    return nights;
  }

}
