import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertDailyMenuDto } from './dto/upsert-daily-menu.dto';
import { CopyDailyMenuDto } from './dto/copy-daily-menu.dto';

/** Only sit-down services are planned per day; snacks and drinks are standing. */
export const PLANNED_MEALS: MenuCategory[] = [
  MenuCategory.BREAKFAST,
  MenuCategory.LUNCH,
  MenuCategory.DINNER,
];

/**
 * A DATE column has no timezone, so a JS Date carrying a local time would land
 * on the wrong day either side of midnight. Everything here is normalised to
 * UTC midnight — the day the estate means, not the instant the server ran.
 */
function toDateOnly(input: string | Date): Date {
  const raw = typeof input === 'string' ? input : input.toISOString();
  const [datePart] = raw.split('T');
  const parsed = new Date(`${datePart}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Invalid date: ${String(input)}`);
  }
  return parsed;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const withItems = {
  items: {
    include: { menuItem: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

@Injectable()
export class DailyMenuService {
  constructor(private prisma: PrismaService) {}

  private assertPlannable(mealType: MenuCategory) {
    if (!PLANNED_MEALS.includes(mealType)) {
      throw new BadRequestException(
        'Only breakfast, lunch and dinner are planned per day — snacks and beverages are always available.',
      );
    }
  }

  /**
   * Every service in a window, drafts included. The dashboard grid.
   *
   * Returns what exists rather than filling gaps: an unplanned meal is the
   * absence of a row, and the grid draws an empty cell for it.
   */
  async getRange(from: string, to: string) {
    const start = toDateOnly(from);
    const end = toDateOnly(to);
    if (end < start) {
      throw new BadRequestException('The end of the range is before its start.');
    }

    return this.prisma.dailyMenu.findMany({
      where: { date: { gte: start, lte: end } },
      include: withItems,
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  /**
   * What a guest may see: published services only, over their stay.
   *
   * Drafts are excluded here rather than filtered in the app, so a half-decided
   * Thursday can't leak through a caller that forgot to check.
   */
  async getPublishedRange(from: string, to: string) {
    const start = toDateOnly(from);
    const end = toDateOnly(to);
    if (end < start) {
      throw new BadRequestException('The end of the range is before its start.');
    }

    return this.prisma.dailyMenu.findMany({
      where: {
        date: { gte: start, lte: end },
        publishedAt: { not: null },
        // A service with nothing on it is a mistake, not an announcement.
        items: { some: {} },
      },
      include: withItems,
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    });
  }

  /**
   * Create or replace one service.
   *
   * The item list is authoritative — the grid sends the whole line-up each
   * time, so removing a dish is the absence of its id rather than a separate
   * call. Publishing state is deliberately NOT touched here: saving edits to a
   * published menu keeps it published, and drafts stay drafts until published
   * explicitly.
   */
  async upsert(dto: UpsertDailyMenuDto, actor: string) {
    this.assertPlannable(dto.mealType);
    const date = toDateOnly(dto.date);

    const menuItemIds = dto.menuItemIds ?? [];
    if (menuItemIds.length > 0) {
      const found = await this.prisma.menuItem.count({
        where: { id: { in: menuItemIds } },
      });
      if (found !== menuItemIds.length) {
        throw new BadRequestException('One or more dishes no longer exist.');
      }
    }

    const existing = await this.prisma.dailyMenu.findUnique({
      where: { date_mealType: { date, mealType: dto.mealType } },
      select: { id: true },
    });

    const menu = existing
      ? await this.prisma.dailyMenu.update({
          where: { id: existing.id },
          data: { note: dto.note ?? null },
        })
      : await this.prisma.dailyMenu.create({
          data: {
            date,
            mealType: dto.mealType,
            note: dto.note ?? null,
            createdBy: actor,
          },
        });

    // Replace wholesale: simpler to reason about than diffing, and the lists
    // are a handful of dishes.
    await this.prisma.dailyMenuItem.deleteMany({ where: { dailyMenuId: menu.id } });
    if (menuItemIds.length > 0) {
      await this.prisma.dailyMenuItem.createMany({
        data: menuItemIds.map((menuItemId, i) => ({
          dailyMenuId: menu.id,
          menuItemId,
          sortOrder: i,
        })),
      });
    }

    return this.byId(menu.id);
  }

  /** Publishing is the moment guests can see it, so it's its own decision. */
  async publish(id: string, actor: string) {
    const menu = await this.prisma.dailyMenu.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!menu) throw new NotFoundException('Menu not found');
    if (menu._count.items === 0) {
      throw new BadRequestException(
        'Add at least one dish before publishing — an empty menu tells a guest nothing.',
      );
    }

    await this.prisma.dailyMenu.update({
      where: { id },
      data: { publishedAt: new Date(), publishedBy: actor },
    });
    return this.byId(id);
  }

  /** Back to draft. The service stays; guests simply stop seeing it. */
  async unpublish(id: string) {
    await this.ensureExists(id);
    await this.prisma.dailyMenu.update({
      where: { id },
      data: { publishedAt: null, publishedBy: null },
    });
    return this.byId(id);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.dailyMenu.delete({ where: { id } });
    return { id };
  }

  /**
   * Copy a stretch of days onto another.
   *
   * A week of menus written from scratch every week is how a feature like this
   * stops being used by month two. Copies arrive as drafts whatever the source
   * was — republishing should be a decision, not a side effect.
   */
  async copy(dto: CopyDailyMenuDto, actor: string) {
    const fromStart = toDateOnly(dto.fromStart);
    const toStart = toDateOnly(dto.toStart);
    const days = dto.days ?? 7;
    if (days < 1 || days > 31) {
      throw new BadRequestException('Copy between 1 and 31 days at a time.');
    }

    const source = await this.prisma.dailyMenu.findMany({
      where: { date: { gte: fromStart, lte: addDays(fromStart, days - 1) } },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (source.length === 0) {
      throw new BadRequestException('There is nothing planned in that week to copy.');
    }

    const offset = toStart.getTime() - fromStart.getTime();
    let copied = 0;

    for (const menu of source) {
      if (menu.items.length === 0) continue;
      const target = new Date(menu.date.getTime() + offset);

      const existing = await this.prisma.dailyMenu.findUnique({
        where: { date_mealType: { date: target, mealType: menu.mealType } },
        select: { id: true, publishedAt: true },
      });

      // Never overwrite something already published — that would silently
      // change a menu a guest has read.
      if (existing?.publishedAt) continue;

      const created = existing
        ? await this.prisma.dailyMenu.update({
            where: { id: existing.id },
            data: { note: menu.note },
          })
        : await this.prisma.dailyMenu.create({
            data: {
              date: target,
              mealType: menu.mealType,
              note: menu.note,
              createdBy: actor,
            },
          });

      await this.prisma.dailyMenuItem.deleteMany({
        where: { dailyMenuId: created.id },
      });
      await this.prisma.dailyMenuItem.createMany({
        data: menu.items.map((item, i) => ({
          dailyMenuId: created.id,
          menuItemId: item.menuItemId,
          sortOrder: i,
        })),
      });
      copied += 1;
    }

    return { copied, skipped: source.length - copied };
  }

  /**
   * How many of the coming days have no published menu.
   *
   * An unplanned week is a silent failure — guests quietly see less than they
   * did before the feature existed, and nothing on the dashboard says so.
   */
  async getPlanningGaps(withinDays = 7) {
    const today = toDateOnly(new Date());
    const end = addDays(today, withinDays - 1);

    const published = await this.prisma.dailyMenu.findMany({
      where: {
        date: { gte: today, lte: end },
        publishedAt: { not: null },
        items: { some: {} },
      },
      select: { date: true, mealType: true },
    });

    const havePublished = new Set(
      published.map((p) => `${p.date.toISOString().slice(0, 10)}:${p.mealType}`),
    );

    const gaps: { date: string; missing: MenuCategory[] }[] = [];
    for (let i = 0; i < withinDays; i += 1) {
      const day = addDays(today, i).toISOString().slice(0, 10);
      const missing = PLANNED_MEALS.filter(
        (meal) => !havePublished.has(`${day}:${meal}`),
      );
      if (missing.length > 0) gaps.push({ date: day, missing });
    }

    return { withinDays, gaps };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.dailyMenu.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Menu not found');
    return found;
  }

  private byId(id: string) {
    return this.prisma.dailyMenu.findUnique({
      where: { id },
      include: withItems,
    });
  }
}
