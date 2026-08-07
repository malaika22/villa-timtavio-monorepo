import { BadRequestException, Injectable } from '@nestjs/common';
import { MenuCourse, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COMPOSED_MEALS,
  ComposedMeal,
  DEFAULT_COURSE_LIMITS,
  DEFAULT_CUTOFF_HOURS,
  DEFAULT_WINDOWS,
  DiningRules,
  MenuRules,
  SittingWindow,
  SittingWindows,
} from './menu.types';

const SETTINGS_SINGLETON = 'singleton';

/** "09:30" → 570. Null when it isn't a 24h clock time. */
export function toMinutes(time: string | null | undefined): number | null {
  if (typeof time !== 'string') return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function toClock(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * The rules the estate sets once and everything else reads: when each meal is
 * served, how many dishes a party may pick per course, and how far ahead a day
 * closes.
 *
 * They live together because they answer one question between them — what a
 * guest is allowed to ask for — and splitting them across two settings screens
 * is how an estate ends up with a 24-hour cutoff and a menu nobody can change.
 */
@Injectable()
export class MenuRulesService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<DiningRules> {
    const settings = await this.prisma.estateSettings.findUnique({
      where: { id: SETTINGS_SINGLETON },
      select: { sittingWindows: true, menuRules: true, sittingTimes: true },
    });

    return {
      windows: this.normalizeWindows(
        settings?.sittingWindows,
        settings?.sittingTimes,
      ),
      menu: this.normalizeMenuRules(settings?.menuRules),
    };
  }

  async update(dto: Partial<DiningRules>): Promise<DiningRules> {
    const current = await this.get();

    // Validated, not coerced. Coercion belongs on the read path, where it
    // rescues old or malformed stored data; on the write path it meant an
    // estate could set breakfast to end at 12:00 AM, be told "saved", and find
    // its own times back to ours on the next reload with nothing said.
    const windows = dto.windows
      ? this.assertWindows(dto.windows)
      : current.windows;
    const menu = dto.menu
      ? this.normalizeMenuRules(dto.menu)
      : current.menu;

    this.assertPlausible(windows);

    await this.prisma.estateSettings.upsert({
      where: { id: SETTINGS_SINGLETON },
      create: {
        id: SETTINGS_SINGLETON,
        sittingWindows: windows as unknown as Prisma.InputJsonValue,
        menuRules: menu as unknown as Prisma.InputJsonValue,
      },
      update: {
        sittingWindows: windows as unknown as Prisma.InputJsonValue,
        menuRules: menu as unknown as Prisma.InputJsonValue,
      },
    });

    return { windows, menu };
  }

  // ─── Reading the rules ──────────────────────────────────────────────────

  /**
   * The moment a service day stops being the party's to change.
   *
   * Counted back from midnight at the *start* of the day, so at 24 hours a
   * Tuesday closes on Monday at 00:00. The kitchen orders against the whole
   * day at once, which is why the deadline is the day's and not each meal's.
   */
  closesAt(date: Date | string, rules: MenuRules): Date {
    const raw = typeof date === 'string' ? date : date.toISOString();
    const dayStart = new Date(`${raw.slice(0, 10)}T00:00:00.000Z`);
    return new Date(dayStart.getTime() - rules.cutoffHours * 60 * 60 * 1000);
  }

  isLocked(date: Date | string, rules: MenuRules, now = new Date()): boolean {
    return now.getTime() >= this.closesAt(date, rules).getTime();
  }

  /**
   * Refuse a sitting the kitchen couldn't serve.
   *
   * The old rule was only that the time looked like a meal time. A guest could
   * still pick the closing minute of the window and arrive as the pass shut —
   * which is the case the estate described, and why `lastSeating` exists.
   */
  assertWithinWindow(
    meal: ComposedMeal,
    time: string,
    windows: SittingWindows,
  ): void {
    const window = windows[meal];
    const chosen = toMinutes(time);
    if (chosen == null) {
      throw new BadRequestException(`${time} isn't a valid time.`);
    }

    const start = toMinutes(window.start);
    const last = toMinutes(window.lastSeating) ?? toMinutes(window.end);
    if (start == null || last == null) return;

    const meal_ = meal.charAt(0) + meal.slice(1).toLowerCase();
    if (chosen < start) {
      throw new BadRequestException(
        `${meal_} is served from ${window.start}. The earliest table is ${window.start}.`,
      );
    }
    if (chosen > last) {
      throw new BadRequestException(
        `${meal_} finishes at ${window.end}, so the last table is ${window.lastSeating}. Ask your concierge if you'd like to eat later.`,
      );
    }
  }

  // ─── Coercion ───────────────────────────────────────────────────────────

  /**
   * @param legacy the old `sittingTimes` slot lists. Read only when no window
   * has been configured, so an estate that set 08:00/09:00/10:00 before this
   * existed keeps serving breakfast at the same hours instead of silently
   * falling back to ours.
   */
  private normalizeWindows(raw: unknown, legacy: unknown): SittingWindows {
    const src = (raw ?? {}) as Record<string, unknown>;
    const legacySrc = (legacy ?? {}) as Record<string, unknown>;

    const out = {} as SittingWindows;
    for (const meal of COMPOSED_MEALS) {
      out[meal] =
        this.readWindow(src[meal]) ??
        this.fromSlots(legacySrc[meal]) ??
        DEFAULT_WINDOWS[meal];
    }
    return out;
  }

  /**
   * The write path: say what's wrong rather than quietly substituting.
   *
   * The case this exists for is 12:00 AM. An estate meaning noon picks AM, the
   * window inverts, and every silent fallback in the world then hands their
   * breakfast back to them at 9–11 with a green "saved" toast on screen.
   */
  private assertWindows(raw: unknown): SittingWindows {
    const src = (raw ?? {}) as Record<string, unknown>;
    const out = {} as SittingWindows;

    for (const meal of COMPOSED_MEALS) {
      const w = (src[meal] ?? {}) as Record<string, unknown>;
      const label = meal.charAt(0) + meal.slice(1).toLowerCase();
      const start = toMinutes(w.start as string);
      const end = toMinutes(w.end as string);

      if (start == null || end == null) {
        throw new BadRequestException(
          `${label} needs a start and an end time.`,
        );
      }
      if (end <= start) {
        throw new BadRequestException(
          `${label} can't finish at ${w.end as string} when it starts at ${w.start as string}. If you meant midday, that's 12:00 PM — 12:00 AM is midnight.`,
        );
      }

      // The last seating is nudged rather than refused: it's a derived
      // convenience, and an estate that leaves it alone still gets a sane one.
      const asked = toMinutes(w.lastSeating as string);
      const last =
        asked == null || asked > end || asked < start
          ? Math.max(start, end - 30)
          : asked;

      out[meal] = {
        start: toClock(start),
        end: toClock(end),
        lastSeating: toClock(last),
      };
    }

    return out;
  }

  private readWindow(raw: unknown): SittingWindow | null {
    if (!raw || typeof raw !== 'object') return null;
    const w = raw as Record<string, unknown>;
    const start = toMinutes(w.start as string);
    const end = toMinutes(w.end as string);
    if (start == null || end == null || end <= start) return null;

    // A last seating that outruns the window is the mistake this field exists
    // to prevent, so it's pulled back rather than trusted.
    const asked = toMinutes(w.lastSeating as string);
    const fallback = Math.max(start, end - 30);
    const last =
      asked == null || asked > end || asked < start ? fallback : asked;

    return {
      start: toClock(start),
      end: toClock(end),
      lastSeating: toClock(last),
    };
  }

  private fromSlots(raw: unknown): SittingWindow | null {
    if (!Array.isArray(raw)) return null;
    const mins = raw
      .map((t) => toMinutes(t as string))
      .filter((m): m is number => m != null);
    if (mins.length === 0) return null;

    const start = Math.min(...mins);
    const end = Math.max(...mins);
    // A single configured slot isn't a window; give it half an hour either way
    // so the guest still has something to choose between.
    const span = end > start ? end : start + 60;
    return {
      start: toClock(start),
      end: toClock(span),
      lastSeating: toClock(Math.max(start, span - 30)),
    };
  }

  private normalizeMenuRules(raw: unknown): MenuRules {
    const src = (raw ?? {}) as Record<string, unknown>;
    const limitsSrc = (src.courseLimits ?? {}) as Record<string, unknown>;

    const courseLimits = {} as Record<MenuCourse, number>;
    for (const course of Object.keys(DEFAULT_COURSE_LIMITS) as MenuCourse[]) {
      const value = Number(limitsSrc[course]);
      courseLimits[course] =
        Number.isFinite(value) && value >= 1 && value <= 30
          ? Math.floor(value)
          : DEFAULT_COURSE_LIMITS[course];
    }

    const hours = Number(src.cutoffHours);
    return {
      cutoffHours:
        Number.isFinite(hours) && hours >= 0 && hours <= 168
          ? Math.floor(hours)
          : DEFAULT_CUTOFF_HOURS,
      courseLimits,
    };
  }

  /**
   * Catch an AM/PM slip before it reaches a guest.
   *
   * Deliberately generous: the point is to refuse "Dinner · 8:15 AM", not to
   * tell an estate when to serve.
   */
  private assertPlausible(windows: SittingWindows) {
    const plausible: Record<ComposedMeal, [number, number]> = {
      BREAKFAST: [5, 12],
      LUNCH: [11, 17],
      DINNER: [16, 23],
    };

    for (const meal of COMPOSED_MEALS) {
      const [from, to] = plausible[meal];
      const window = windows[meal];
      for (const time of [window.start, window.end]) {
        const hour = Math.floor((toMinutes(time) ?? 0) / 60);
        if (hour < from || hour > to) {
          throw new BadRequestException(
            `${time} isn't a plausible ${meal.toLowerCase()} time — expected between ${String(from).padStart(2, '0')}:00 and ${to}:00.`,
          );
        }
      }
    }
  }
}
