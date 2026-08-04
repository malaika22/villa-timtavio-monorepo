'use client';

import { useMemo, useState } from 'react';
import { CalendarRange, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { useMenu, useDeleteMenuItem } from '@/hooks/useMenu';
import { MenuFormDialog } from '@/components/manager/pages/menu/MenuFormDialog';
import { SittingTimesCard } from '@/components/manager/pages/menu/SittingTimesCard';
import { MenuWeekGrid } from '@/components/manager/pages/menu/MenuWeekGrid';
import type { MenuCategory, MenuItem } from '@repo/api-types';

const TABS: { value: MenuCategory; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'BEVERAGES', label: 'Beverages' },
];

const DIET_BADGES: { key: keyof MenuItem; label: string; tone: string }[] = [
  { key: 'isVegetarian', label: 'Vegetarian', tone: 'bg-[#e8f1e9] text-[#3a6448]' },
  { key: 'isVegan', label: 'Vegan', tone: 'bg-[#e8f1e9] text-[#3a6448]' },
  { key: 'isGlutenFree', label: 'Gluten free', tone: 'bg-[#eef0f5] text-[#3a4a6b]' },
  { key: 'containsNuts', label: 'Contains nuts', tone: 'bg-[#fef6f4] text-[#9a3a30]' },
  { key: 'containsDairy', label: 'Contains dairy', tone: 'bg-[#fef6f4] text-[#9a3a30]' },
  {
    key: 'containsShellfish',
    label: 'Contains shellfish',
    tone: 'bg-[#fef6f4] text-[#9a3a30]',
  },
];

export const MenuPage = () => {
  // Two jobs on one page: what the kitchen is cooking this week, and the
  // library of dishes it draws from. The week leads, because it's the one that
  // changes daily and the one guests actually read.
  const [view, setView] = useState<'week' | 'library'>('week');
  const [activeTab, setActiveTab] = useState<MenuCategory>('BREAKFAST');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const { data: items, isLoading } = useMenu();
  const deleteItem = useDeleteMenuItem();

  const visible = useMemo(
    () => (items ?? []).filter((i) => i.category === activeTab),
    [items, activeTab],
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  return (
    <div className="font-inter space-y-5">
      <div className="inline-flex rounded-lg border border-manager-border bg-white p-0.5">
        <button
          type="button"
          onClick={() => setView('week')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium',
            view === 'week'
              ? 'bg-manager-accent text-white'
              : 'text-manager-text-muted',
          )}
        >
          <CalendarRange className="size-4" />
          This week&rsquo;s menus
        </button>
        <button
          type="button"
          onClick={() => setView('library')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-sm font-medium',
            view === 'library'
              ? 'bg-manager-accent text-white'
              : 'text-manager-text-muted',
          )}
        >
          Dish library
        </button>
      </div>

      {view === 'week' ? (
        <>
          <SittingTimesCard />
          <MenuWeekGrid />
        </>
      ) : (
      <>
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeTab === t.value
                  ? 'bg-manager-accent text-white'
                  : 'bg-white text-manager-text-muted hover:bg-[#faf9f7] border border-manager-border',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-manager-accent px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          Add item
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d4d0c8] bg-white px-6 py-12 text-center">
          <p className="text-sm text-manager-text-muted">
            No {TABS.find((t) => t.value === activeTab)?.label.toLowerCase()}{' '}
            items yet.
          </p>
          <button
            onClick={openCreate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-manager-border bg-white px-3 py-1.5 text-xs font-medium text-manager-text hover:bg-[#faf9f7]"
          >
            <Plus className="size-3.5" /> Add the first item
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-xl border border-manager-border bg-white shadow-[0_1px_3px_rgba(26,22,20,0.04)]"
            >
              {item.photoUrl ? (
                <div className="h-28 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                // A missing photo used to render nothing, so a half-photographed
                // menu came out as a ragged mix of tall and short cards. This
                // holds the space and says the photo is coming, which is true.
                <div
                  className="flex h-28 w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#fbf3df] to-[#f0ede6]"
                  aria-hidden
                >
                  <UtensilsCrossed
                    className="size-6 text-[#b08d57]"
                    strokeWidth={1.25}
                  />
                  <span className="text-[9px] font-medium uppercase tracking-[1px] text-[#9a8a6b]">
                    Photo coming soon
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-manager-text">
                    {item.name}
                  </h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex size-7 items-center justify-center rounded-md text-manager-text-muted hover:bg-[#faf9f7]"
                      aria-label="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${item.name}" from the menu?`)) {
                          deleteItem.mutate(item.id);
                        }
                      }}
                      className="flex size-7 items-center justify-center rounded-md text-manager-text-muted hover:bg-[#fef6f4] hover:text-[#9a3a30]"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-manager-text-muted">
                    {item.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
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
      )}
      </>
      )}

      <MenuFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        defaultCategory={activeTab}
      />
    </div>
  );
};
