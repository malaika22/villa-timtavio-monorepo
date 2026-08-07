import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MenuCourse, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService, PUSHER_CHANNELS } from '../pusher/pusher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ACTIVE_BOOKING_STATUSES } from '../bookings/booking-status.constants';
import { MenuRulesService } from './menu-rules.service';
import { UpsertMenuSelectionDto } from './dto/upsert-menu-selection.dto';
import {
  COMPOSED_MEALS,
  COURSES_BY_MEAL,
  ComposedMeal,
  DiningRules,
  MEAL_BY_COURSE,
} from './menu.types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date only, UTC — a meal belongs to a day, not an instant. */
function toDateOnly(input: string | Date): Date {
  const raw = typeof input === 'string' ? input : input.toISOString();
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date: ${String(input)}`);
  }
  return parsed;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Which meals a party is normally present for on a given day of their stay.
 *
 * Arrival day has no breakfast and departure day has no lunch or dinner,
 * because check-in is mid-afternoon and check-out is late morning. It matters
 * more than it looks: an unchosen meal falls to the chef, and a chef cooking
 * breakfast for a party still on a plane is the kind of waste that makes an
 * estate stop trusting the system.
 *
 * It's a default, not a law — see {@link servedOnDay}. A dawn flight is a real
 * thing and the concierge is the one who knows about it.
 */
export function mealsOnDay(
  date: Date,
  checkIn: Date,
  checkOut: Date,
): ComposedMeal[] {
  const day = iso(date);
  const first = day === iso(checkIn);
  const last = day === iso(checkOut);
  if (first && last) return [];
  if (first) return ['LUNCH', 'DINNER'];
  if (last) return ['BREAKFAST'];
  return ['BREAKFAST', 'LUNCH', 'DINNER'];
}

/**
 * What the estate is actually serving that day: the default, plus anything it
 * has added.
 *
 * A selection row *is* the override. The estate adding breakfast to an arrival
 * day creates an empty one, which is enough for the meal to appear on the run
 * sheet and in the party's plan — no second table needed to record a decision
 * the first one already implies.
 */
export function servedOnDay(
  date: Date,
  checkIn: Date,
  checkOut: Date,
  selections: { date: Date; mealType: string }[],
): ComposedMeal[] {
  const base = mealsOnDay(date, checkIn, checkOut);
  const day = iso(date);
  const added = selections
    .filter((s) => iso(s.date) === day)
    .map((s) => s.mealType as ComposedMeal)
    .filter((m) => COMPOSED_MEALS.includes(m) && !base.includes(m));

  return [...new Set([...base, ...added])].sort(
    (a, b) => COMPOSED_MEALS.indexOf(a) - COMPOSED_MEALS.indexOf(b),
  );
}

const selectionInclude = {
  items: {
    include: { menuItem: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

@Injectable()
export class MenuSelectionService {
  constructor(
    private prisma: PrismaService,
    private rules: MenuRulesService,
    private pusher: PusherService,
    private notifications: NotificationsService,
  ) {}

  /**
   * The whole stay, day by day, with what has been chosen and what is still
   * open.
   *
   * Built server-side rather than left to the app: whether a Tuesday is still
   * the party's to change is the same question for the guest app, the run
   * sheet and the endpoint that saves it, and three implementations of one
   * deadline is three chances to disagree about it.
   */
  async getPlan(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, checkIn: true, checkOut: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const rules = await this.rules.get();
    const checkIn = toDateOnly(booking.checkIn);
    const checkOut = toDateOnly(booking.checkOut);

    const selections = await this.prisma.menuSelection.findMany({
      where: { bookingId },
      include: selectionInclude,
    });
    const byKey = new Map(
      selections.map((s) => [`${iso(s.date)}:${s.mealType}`, s]),
    );

    const now = new Date();
    const days: unknown[] = [];
    for (
      let d = checkIn;
      d <= checkOut && days.length < 60;
      d = new Date(d.getTime() + DAY_MS)
    ) {
      const meals = servedOnDay(d, checkIn, checkOut, selections);
      if (meals.length === 0) continue;

      const closesAt = this.rules.closesAt(d, rules.menu);
      days.push({
        date: iso(d),
        closesAt: closesAt.toISOString(),
        isLocked: now >= closesAt,
        meals: meals.map((mealType) => {
          const selection = byKey.get(`${iso(d)}:${mealType}`) ?? null;
          return {
            mealType,
            window: rules.windows[mealType],
            courses: COURSES_BY_MEAL[mealType],
            selection: selection && this.shape(selection),
          };
        }),
      });
    }

    return { bookingId, rules, days };
  }

  /**
   * Compose one meal.
   *
   * @param actor `isEstate` is what lets the concierge amend a day the kitchen
   * has already been told about. A party whose plans change still telephones —
   * the difference is that the change now lands on the run sheet with a name
   * against it instead of on a sticky note.
   */
  async upsert(
    bookingId: string,
    dto: UpsertMenuSelectionDto,
    actor: { email: string; name: string; isEstate?: boolean },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, checkIn: true, checkOut: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const rules = await this.rules.get();
    const date = toDateOnly(dto.date);
    const checkIn = toDateOnly(booking.checkIn);
    const checkOut = toDateOnly(booking.checkOut);

    if (date < checkIn || date > checkOut) {
      throw new BadRequestException(
        'That date falls outside your stay, so there is nothing to plan on it.',
      );
    }

    const meal = dto.mealType as ComposedMeal;
    if (!COMPOSED_MEALS.includes(meal)) {
      throw new BadRequestException(
        'Only breakfast, lunch and dinner are composed.',
      );
    }

    // The default pattern skips breakfast on arrival day and lunch and dinner
    // on departure day. The estate can serve one anyway — a dawn flight is a
    // real thing and the concierge is the one who knows about it — but a guest
    // can only compose a meal that's already on the plan.
    const served = await this.servedMealsFor(bookingId, date, checkIn, checkOut);
    if (!served.includes(meal) && !actor.isEstate) {
      throw new BadRequestException(
        `${meal.charAt(0)}${meal.slice(1).toLowerCase()} isn't served on ${iso(date)} — ask your concierge if you'd like it.`,
      );
    }

    const locked = this.rules.isLocked(date, rules.menu);
    if (locked && !actor.isEstate) {
      throw new ForbiddenException(
        'This day is with the kitchen now. Your concierge can still change it for you.',
      );
    }

    const items = await this.resolveItems(dto.menuItemIds, meal, rules);

    const existing = await this.prisma.menuSelection.findUnique({
      where: {
        bookingId_date_mealType: { bookingId, date, mealType: dto.mealType },
      },
      select: {
        id: true,
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });

    // What the kitchen had been told, kept for the run sheet. A swap that
    // silently becomes the truth is worse than no swap: the chef needs to see
    // that tonight's main *was* the ribeye.
    const wasChosen = existing?.items.map((i) => i.menuItem.name) ?? [];

    const stamp = actor.isEstate
      ? {
          amendedByEmail: actor.email,
          amendedAt: new Date(),
          amendedFrom:
            wasChosen.length > 0
              ? (wasChosen as unknown as Prisma.InputJsonValue)
              : Prisma.DbNull,
        }
      : {
          chosenByEmail: actor.email,
          chosenByName: actor.name,
          chosenAt: new Date(),
          // The party choosing again is a fresh decision, not an amendment of
          // one — leaving the old stamp would keep accusing the estate.
          amendedByEmail: null,
          amendedAt: null,
          amendedFrom: Prisma.DbNull,
        };

    const selection = existing
      ? await this.prisma.menuSelection.update({
          where: { id: existing.id },
          data: { note: dto.note?.trim() || null, ...stamp },
        })
      : await this.prisma.menuSelection.create({
          data: {
            bookingId,
            date,
            mealType: dto.mealType,
            note: dto.note?.trim() || null,
            ...stamp,
          },
        });

    // The list is authoritative, so it's replaced rather than diffed — a meal
    // is a handful of dishes and "what's on it now" is easier to be sure of.
    await this.prisma.menuSelectionItem.deleteMany({
      where: { selectionId: selection.id },
    });
    if (items.length > 0) {
      await this.prisma.menuSelectionItem.createMany({
        data: items.map((item, i) => ({
          selectionId: selection.id,
          menuItemId: item.id,
          course: item.course!,
          sortOrder: i,
        })),
      });
    }

    // The kitchen works off this. An open run sheet should not need a refresh
    // to learn that tonight's main changed.
    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'menu.composed', {
      bookingId,
      date: iso(date),
      mealType: dto.mealType,
      byEstate: !!actor.isEstate,
    });
    await this.pusher.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      'menu.composed',
      { date: iso(date), mealType: dto.mealType, byEstate: !!actor.isEstate },
    );

    return this.byId(selection.id);
  }

  private async servedMealsFor(
    bookingId: string,
    date: Date,
    checkIn: Date,
    checkOut: Date,
  ): Promise<ComposedMeal[]> {
    const rows = await this.prisma.menuSelection.findMany({
      where: { bookingId, date },
      select: { date: true, mealType: true },
    });
    return servedOnDay(date, checkIn, checkOut, rows);
  }

  /**
   * Stop serving a meal, or clear one.
   *
   * The same call does both, because at the data level they are the same thing:
   * a meal the estate added exists only as its selection row, so removing the
   * row un-adds it — while for a meal that's served by default, removing the
   * row simply means nothing is chosen and the chef decides.
   */
  async remove(
    bookingId: string,
    dateStr: string,
    mealType: string,
    actor: { email: string },
  ) {
    const date = toDateOnly(dateStr);
    const existing = await this.prisma.menuSelection.findUnique({
      where: {
        bookingId_date_mealType: {
          bookingId,
          date,
          mealType: mealType as ComposedMeal,
        },
      },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Nothing to remove');

    await this.prisma.menuSelection.delete({ where: { id: existing.id } });

    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'menu.composed', {
      bookingId,
      date: iso(date),
      mealType,
      byEstate: true,
      removedBy: actor.email,
    });
    await this.pusher.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      'menu.composed',
      { date: iso(date), mealType, byEstate: true },
    );

    return { bookingId, date: iso(date), mealType };
  }

  /**
   * Ask the party to finish a day before it closes.
   *
   * The run sheet already knows which meals are open; without this the only
   * thing an estate can do about it is nothing, and the day quietly falls to
   * the chef. Chef's choice should be a decision somebody made.
   */
  async nudge(bookingId: string, dateStr: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        primaryGuest: { select: { email: true, firstName: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const rules = await this.rules.get();
    const date = toDateOnly(dateStr);
    const closesAt = this.rules.closesAt(date, rules.menu);

    const selections = await this.prisma.menuSelection.findMany({
      where: { bookingId, date },
      include: { _count: { select: { items: true } } },
    });
    const served = servedOnDay(
      date,
      toDateOnly(booking.checkIn),
      toDateOnly(booking.checkOut),
      selections,
    );
    const open = served.filter(
      (meal) =>
        (selections.find((s) => s.mealType === meal)?._count.items ?? 0) === 0,
    );

    if (open.length === 0) {
      throw new BadRequestException(
        'Every meal on that day has been chosen — there is nothing to chase.',
      );
    }

    const when = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
    const meals = open
      .map((m) => m.charAt(0) + m.slice(1).toLowerCase())
      .join(' and ');

    await this.notifications.send({
      bookingId,
      recipientEmail: booking.primaryGuest.email,
      type: 'EXPERIENCE_READY',
      title: `${when} is still to choose`,
      body: `${meals} on ${when} hasn't been decided yet. Choices close ${closesAt.toLocaleDateString(
        'en-GB',
        { weekday: 'short', timeZone: 'UTC' },
      )} — after that the chef will choose for you.`,
      deepLink: '/dining',
    });

    await this.pusher.trigger(
      PUSHER_CHANNELS.guestBooking(bookingId),
      'menu.nudge',
      { date: iso(date), meals: open },
    );

    return { bookingId, date: iso(date), meals: open };
  }

  /**
   * Check the dishes against the menu, then against the allowances.
   *
   * Order matters: telling someone they've picked four mains is only useful
   * once we know all four are real dishes on tonight's menu.
   */
  private async resolveItems(
    menuItemIds: string[],
    meal: ComposedMeal,
    rules: DiningRules,
  ) {
    const ids = [...new Set(menuItemIds)];
    if (ids.length === 0) return [];

    const dishes = await this.prisma.menuItem.findMany({
      where: { id: { in: ids }, isActive: true },
    });
    if (dishes.length !== ids.length) {
      throw new BadRequestException(
        'One or more of those dishes is no longer on the menu.',
      );
    }

    const counts = new Map<MenuCourse, number>();
    for (const dish of dishes) {
      if (!dish.course || MEAL_BY_COURSE[dish.course] !== meal) {
        throw new BadRequestException(
          `“${dish.name}” isn't on the ${meal.toLowerCase()} menu.`,
        );
      }
      counts.set(dish.course, (counts.get(dish.course) ?? 0) + 1);
    }

    for (const [course, count] of counts) {
      const limit = rules.menu.courseLimits[course];
      if (count > limit) {
        throw new BadRequestException(
          `You may choose ${limit} from ${this.courseLabel(course)} — you've chosen ${count}.`,
        );
      }
    }

    // Keep the printed order, so the run sheet reads like the menu.
    return dishes.sort(
      (a, b) =>
        COURSES_BY_MEAL[meal].indexOf(a.course!) -
          COURSES_BY_MEAL[meal].indexOf(b.course!) || a.sortOrder - b.sortOrder,
    );
  }

  // ─── The kitchen's run sheet ────────────────────────────────────────────

  /**
   * Every meal the estate is cooking over a stretch of days.
   *
   * This is the screen that replaces confirming sittings one by one. It answers
   * what the chef actually asks — how many, at what time, cooking what, and who
   * can't eat what — and it repeats the allergies on every single day rather
   * than linking to the manifest, because a page a chef works from should never
   * require them to remember to go and check something.
   */
  async getKitchenSheet(from: string, to: string) {
    const start = toDateOnly(from);
    const end = toDateOnly(to);
    if (end < start) {
      throw new BadRequestException('The end of the range is before its start.');
    }
    if (end.getTime() - start.getTime() > 30 * DAY_MS) {
      throw new BadRequestException('Ask for a month at a time or less.');
    }

    const rules = await this.rules.get();

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: ACTIVE_BOOKING_STATUSES },
        checkIn: { lte: end },
        checkOut: { gte: start },
      },
      include: {
        primaryGuest: true,
        manifestGuests: true,
        menuSelections: { include: selectionInclude },
        diningRequests: {
          where: { kind: 'SITTING', status: { not: 'CANCELLED' } },
        },
      },
    });

    const now = new Date();
    const days: unknown[] = [];

    for (
      let d = start;
      d <= end;
      d = new Date(d.getTime() + DAY_MS)
    ) {
      const day = iso(d);
      const closesAt = this.rules.closesAt(d, rules.menu);

      const services: unknown[] = [];
      for (const booking of bookings) {
        const checkIn = toDateOnly(booking.checkIn);
        const checkOut = toDateOnly(booking.checkOut);
        if (d < checkIn || d > checkOut) continue;

        const meals = servedOnDay(
          d,
          checkIn,
          checkOut,
          booking.menuSelections,
        );
        if (meals.length === 0) continue;

        const dietary = this.dietaryBrief(booking);
        const defaults = mealsOnDay(d, checkIn, checkOut);

        for (const mealType of meals) {
          const selection = booking.menuSelections.find(
            (s) => iso(s.date) === day && s.mealType === mealType,
          );
          const sitting = booking.diningRequests.find(
            (r) => r.date && iso(r.date) === day && r.mealType === mealType,
          );

          services.push({
            bookingId: booking.id,
            partyName: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`.trim(),
            mealType,
            window: rules.windows[mealType],
            sittingTime: sitting?.time ?? null,
            covers: sitting?.partySize ?? booking.totalGuests,
            lateArrivals: sitting?.lateArrivals ?? null,
            // Repeated on every service, deliberately. See above.
            dietary,
            note: selection?.note ?? null,
            chosen: selection ? this.shape(selection) : null,
            amendedAt: selection?.amendedAt?.toISOString() ?? null,
            amendedByEmail: selection?.amendedByEmail ?? null,
            /**
             * The estate added this one — breakfast on an arrival day for a
             * party off a dawn flight. Flagged so the sheet can say so, and so
             * removing it reads as "we're not serving it" rather than
             * "somebody deleted the choices".
             */
            addedByEstate: !defaults.includes(mealType),
          });
        }
      }

      if (services.length > 0) {
        days.push({
          date: day,
          closesAt: closesAt.toISOString(),
          isLocked: now >= closesAt,
          services,
        });
      }
    }

    return { from: iso(start), to: iso(end), rules, days };
  }

  /**
   * Who in the party can't eat what.
   *
   * Both sources, always: the primary's restrictions live on their guest record
   * and everyone else's on the manifest, and a brief that reads only one of
   * them is worse than none — it looks complete.
   */
  private dietaryBrief(booking: {
    primaryGuest: {
      firstName: string;
      lastName: string;
      allergies: string | null;
      dietaryRestrictions: string[];
    };
    manifestGuests: {
      firstName: string;
      lastName: string;
      allergies: string | null;
      dietaryRestrictions: string[];
      dietaryOtherDetails: string | null;
    }[];
  }) {
    const rows = [
      {
        name: `${booking.primaryGuest.firstName} ${booking.primaryGuest.lastName}`.trim(),
        allergies: booking.primaryGuest.allergies,
        restrictions: booking.primaryGuest.dietaryRestrictions,
        other: null as string | null,
      },
      ...booking.manifestGuests.map((g) => ({
        name: `${g.firstName} ${g.lastName}`.trim(),
        allergies: g.allergies,
        restrictions: g.dietaryRestrictions,
        other: g.dietaryOtherDetails,
      })),
    ];

    return rows.filter(
      (r) => !!r.allergies?.trim() || r.restrictions.length > 0 || !!r.other?.trim(),
    );
  }

  // ─── Shaping ────────────────────────────────────────────────────────────

  private shape(selection: {
    id: string;
    date: Date;
    mealType: string;
    note: string | null;
    chosenByName: string | null;
    chosenAt: Date | null;
    amendedByEmail: string | null;
    amendedAt: Date | null;
    amendedFrom?: unknown;
    items: { id: string; menuItemId: string; course: MenuCourse; sortOrder: number; menuItem: unknown }[];
  }) {
    return {
      id: selection.id,
      date: iso(selection.date),
      mealType: selection.mealType,
      note: selection.note,
      chosenByName: selection.chosenByName,
      chosenAt: selection.chosenAt?.toISOString() ?? null,
      amendedByEmail: selection.amendedByEmail,
      amendedAt: selection.amendedAt?.toISOString() ?? null,
      amendedFrom: Array.isArray(selection.amendedFrom)
        ? (selection.amendedFrom as string[])
        : null,
      items: selection.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        course: item.course,
        sortOrder: item.sortOrder,
        menuItem: item.menuItem,
      })),
    };
  }

  private courseLabel(course: MenuCourse): string {
    const labels: Record<MenuCourse, string> = {
      BREAKFAST_MAIN: 'the breakfast menu',
      BREAKFAST_SUGGESTION: 'the daily suggestions',
      LUNCH_SELECTION: 'the curated selection',
      DINNER_STARTER: 'the starters',
      DINNER_MAIN: 'the main dishes',
      DINNER_DESSERT: 'the desserts',
    };
    return labels[course];
  }

  private async byId(id: string) {
    const found = await this.prisma.menuSelection.findUnique({
      where: { id },
      include: selectionInclude,
    });
    return found && this.shape(found);
  }
}
