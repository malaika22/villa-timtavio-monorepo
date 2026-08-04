'use client';

import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useMenu } from '@/hooks/useMenu';
import type { MenuCategory, MenuItem } from '@repo/api-types';

const CATEGORY_ORDER: MenuCategory[] = [
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACKS',
  'BEVERAGES',
];
const CATEGORY_LABEL: Record<MenuCategory, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACKS: 'Snacks',
  BEVERAGES: 'Beverages',
  EXCLUSIVE: 'Exclusive additions',
};

const DIET_BADGES: { key: keyof MenuItem; label: string; tone: string }[] = [
  { key: 'isVegetarian', label: 'Veg', tone: 'bg-[#e8f1e9] text-[#3a6448]' },
  { key: 'isVegan', label: 'Vegan', tone: 'bg-[#e8f1e9] text-[#3a6448]' },
  { key: 'isGlutenFree', label: 'GF', tone: 'bg-[#eef0f5] text-[#3a4a6b]' },
  { key: 'containsNuts', label: 'Nuts', tone: 'bg-[#fef6f4] text-[#9a3a30]' },
  {
    key: 'containsShellfish',
    label: 'Shellfish',
    tone: 'bg-[#fef6f4] text-[#9a3a30]',
  },
];

export const MenusTabView = () => {
  const { data: items, isLoading } = useMenu();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dbe7df] bg-[#f3f8f4] px-4 py-3">
        <p className="text-sm text-[#3a6448]">
          The all-inclusive dining menu shown to guests, grouped by meal.
        </p>
        <Link
          href="/menu"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-manager-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          <UtensilsCrossed className="size-3.5" />
          Manage menu
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : (items?.length ?? 0) === 0 ? (
        <EmptyTab label="menu items" href="/menu" cta="Add menu items" />
      ) : (
        CATEGORY_ORDER.map((cat) => {
          const group = (items ?? []).filter((i) => i.category === cat);
          if (group.length === 0) return null;
          return (
            <section key={cat}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-manager-text-muted">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-manager-border bg-white shadow-[0_1px_3px_rgba(26,22,20,0.04)]"
                  >
                    {item.photoUrl && (
                      <div className="h-24 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-3.5">
                      <p className="text-sm font-semibold text-manager-text">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-manager-text-muted">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {DIET_BADGES.filter((b) => item[b.key]).map((b) => (
                          <span
                            key={b.label}
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium',
                              b.tone,
                            )}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

export function EmptyTab({
  label,
  href,
  cta,
}: {
  label: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#d4d0c8] bg-white px-6 py-12 text-center">
      <p className="text-sm text-manager-text-muted">No {label} yet.</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-manager-border bg-white px-3 py-1.5 text-xs font-medium text-manager-text hover:bg-[#faf9f7]"
      >
        {cta}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
