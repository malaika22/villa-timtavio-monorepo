'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Loader2, Trash2, UtensilsCrossed, X } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import type { DailyMenu, MenuCategory, MenuItem } from '@repo/api-types';

import { useMenu, useCreateMenuItem } from '@/hooks/useMenu';
import {
  useDeleteDailyMenu,
  usePublishDailyMenu,
  useUnpublishDailyMenu,
  useUpsertDailyMenu,
} from '@/hooks/useDailyMenus';

const MEAL_LABEL: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/** The flags that matter to a guest deciding whether they can eat something. */
function dietTags(item: MenuItem): string[] {
  const tags: string[] = [];
  if (item.isVegan) tags.push('Vegan');
  else if (item.isVegetarian) tags.push('Vegetarian');
  if (item.isGlutenFree) tags.push('Gluten free');
  if (item.containsNuts) tags.push('Nuts');
  if (item.containsDairy) tags.push('Dairy');
  if (item.containsShellfish) tags.push('Shellfish');
  return tags;
}

/**
 * Planning one service.
 *
 * Dishes come from the library the estate already curates, so their photos and
 * dietary flags come with them rather than being retyped. A one-off is a real
 * dish that simply never joins the library — planning a Thursday shouldn't
 * permanently enlarge the menu, but it also shouldn't cost the guest the
 * allergy information every other dish carries.
 */
export const MenuServiceEditor = ({
  date,
  mealType,
  menu,
  onClose,
}: {
  date: string;
  mealType: MenuCategory;
  menu?: DailyMenu;
  onClose: () => void;
}) => {
  const { data: library = [] } = useMenu();
  const upsert = useUpsertDailyMenu();
  const publish = usePublishDailyMenu();
  const unpublish = useUnpublishDailyMenu();
  const remove = useDeleteDailyMenu();
  const createDish = useCreateMenuItem();

  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [oneOffName, setOneOffName] = useState('');
  const [addingOneOff, setAddingOneOff] = useState(false);

  // Reload whenever the cell changes, so opening Thursday after Wednesday
  // doesn't inherit Wednesday's line-up.
  useEffect(() => {
    setSelected(menu?.items.map((i) => i.menuItemId) ?? []);
    setNote(menu?.note ?? '');
    setOneOffName('');
    setAddingOneOff(false);
  }, [menu?.id, date, mealType]);

  const published = !!menu?.publishedAt;
  const busy =
    upsert.isPending || publish.isPending || unpublish.isPending || remove.isPending;

  // The library is curated per category, so a dinner service offers dinner
  // dishes — plus any one-off already on this service, which by definition
  // isn't in the library.
  const choices: MenuItem[] = [
    ...library.filter((i) => i.category === mealType),
    ...(menu?.items ?? [])
      .map((i) => i.menuItem)
      .filter((i) => !library.some((l) => l.id === i.id)),
  ];

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const save = (thenPublish: boolean) => {
    upsert.mutate(
      { date, mealType, note: note.trim() || undefined, menuItemIds: selected },
      {
        onSuccess: (saved) => {
          if (!thenPublish) {
            toast.success('Saved as a draft', {
              description: 'Guests won’t see it until you publish.',
            });
            onClose();
            return;
          }
          publish.mutate(saved.id, {
            onSuccess: () => {
              toast.success(
                `${MEAL_LABEL[mealType]} published for ${format(parseISO(date), 'EEEE d MMM')}`,
              );
              onClose();
            },
            onError: (e) => toast.error((e as Error).message),
          });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const addOneOff = () => {
    const name = oneOffName.trim();
    if (!name) return;
    createDish.mutate(
      // isStanding false keeps it out of the library — it belongs to this night.
      { name, category: mealType, isStanding: false } as never,
      {
        onSuccess: (dish: MenuItem) => {
          setSelected((prev) => [...prev, dish.id]);
          setOneOffName('');
          setAddingOneOff(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {MEAL_LABEL[mealType] ?? mealType} ·{' '}
            {format(parseISO(date), 'EEEE d MMMM')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              published
                ? 'bg-[#e9f2ea] text-[#3f6b45]'
                : 'bg-[#f7f0e2] text-[#8a6d3b]',
            )}
          >
            {published
              ? 'Published — guests can see this. Saving keeps it published.'
              : 'Draft — no guest can see this yet.'}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-manager-text-muted">
              Note to guests (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Chef’s table — the whole menu off the coast this evening."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-manager-text-muted">
              Dishes · {selected.length} selected
            </label>

            {choices.length === 0 ? (
              <p className="rounded-lg border border-dashed border-manager-border px-3 py-6 text-center text-sm text-manager-text-muted">
                No {MEAL_LABEL[mealType]?.toLowerCase()} dishes in the library
                yet. Add one below, or create them on the Menu tab.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {choices.map((dish) => {
                  const on = selected.includes(dish.id);
                  const tags = dietTags(dish);
                  return (
                    <li key={dish.id}>
                      <button
                        type="button"
                        onClick={() => toggle(dish.id)}
                        aria-pressed={on}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left',
                          on
                            ? 'border-manager-accent bg-[#faf6ee]'
                            : 'border-manager-border bg-manager-card',
                        )}
                      >
                        {dish.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={dish.photoUrl}
                            alt=""
                            className="size-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded border border-manager-border bg-gradient-to-br from-[#fbf3df] to-[#f0ede6]"
                            aria-hidden
                          >
                            <UtensilsCrossed
                              className="size-4 text-[#b08d57]"
                              strokeWidth={1.5}
                            />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-manager-text">
                            {dish.name}
                            {dish.isStanding === false && (
                              <span className="ml-1.5 text-[10px] uppercase tracking-wide text-manager-text-muted">
                                one-off
                              </span>
                            )}
                          </span>
                          {tags.length > 0 && (
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded bg-[#f0ede7] px-1 py-0.5 text-[9px] uppercase tracking-wide text-manager-text-muted"
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                        {on && (
                          <Check className="size-4 shrink-0 text-manager-accent" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {addingOneOff ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={oneOffName}
                  onChange={(e) => setOneOffName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOneOff()}
                  placeholder="Dish name for this service only"
                />
                <Button
                  type="button"
                  onClick={addOneOff}
                  disabled={!oneOffName.trim() || createDish.isPending}
                  className="bg-manager-accent text-white"
                >
                  {createDish.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Cancel"
                  onClick={() => setAddingOneOff(false)}
                  className="border-manager-border bg-manager-card"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingOneOff(true)}
                className="w-full rounded-lg border border-dashed border-manager-accent px-3 py-2 text-sm text-manager-accent"
              >
                + Add a one-off dish for this service
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-manager-border pt-3">
            {menu && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  remove.mutate(menu.id, {
                    onSuccess: () => {
                      toast.success('Service removed');
                      onClose();
                    },
                    onError: (e) => toast.error((e as Error).message),
                  })
                }
                disabled={busy}
                className="border-manager-border bg-manager-card text-[#b42318]"
              >
                <Trash2 className="mr-1.5 size-4" />
                Remove
              </Button>
            )}

            {published && menu && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  unpublish.mutate(menu.id, {
                    onSuccess: () =>
                      toast.success('Back to draft — guests no longer see it'),
                    onError: (e) => toast.error((e as Error).message),
                  })
                }
                disabled={busy}
                className="border-manager-border bg-manager-card text-manager-text"
              >
                Unpublish
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => save(false)}
              disabled={busy}
              className="ml-auto border-manager-border bg-manager-card text-manager-text"
            >
              Save draft
            </Button>
            <Button
              type="button"
              onClick={() => save(true)}
              disabled={busy || selected.length === 0}
              className="bg-manager-accent text-white hover:opacity-90"
            >
              {busy ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              {published ? 'Save' : 'Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
