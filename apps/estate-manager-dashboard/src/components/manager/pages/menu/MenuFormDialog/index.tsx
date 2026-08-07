'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { X } from 'lucide-react';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenu';
import { ImageUpload } from '@/components/manager/ui/ImageUpload';
import type {
  MealType,
  MenuCategory,
  MenuCourse,
  MenuItem,
  MenuItemDto,
} from '@repo/api-types';
import { COURSE_LABELS, COURSES_BY_MEAL } from '@repo/api-types';

/**
 * The courses available for a category, if it has any.
 *
 * Snacks, beverages and exclusives are ordered on demand rather than composed,
 * so a course on one would be a number nothing counts against.
 */
const coursesFor = (category: MenuCategory): MenuCourse[] =>
  COURSES_BY_MEAL[category as MealType] ?? [];

const CATEGORY_OPTIONS: { value: MenuCategory; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'EXCLUSIVE', label: 'Exclusive addition' },
];

const DIET_FLAGS: { key: keyof MenuItemDto; label: string }[] = [
  { key: 'isVegetarian', label: 'Vegetarian' },
  { key: 'isVegan', label: 'Vegan' },
  { key: 'isGlutenFree', label: 'Gluten-free' },
  { key: 'containsNuts', label: 'Contains nuts' },
  { key: 'containsDairy', label: 'Contains dairy' },
  { key: 'containsShellfish', label: 'Contains shellfish' },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  defaultCategory?: MenuCategory;
};

const blank = (category: MenuCategory): MenuItemDto => ({
  name: '',
  category,
  course: coursesFor(category)[0] ?? null,
  description: '',
  photoUrl: '',
  isActive: true,
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  containsNuts: false,
  containsDairy: false,
  containsShellfish: false,
  otherDietaryNotes: '',
  sortOrder: 0,
});

function formFromItem(
  item: MenuItem | null | undefined,
  defaultCategory: MenuCategory,
): MenuItemDto {
  if (!item) return blank(defaultCategory);
  return {
    name: item.name,
    category: item.category,
    course: item.course ?? null,
    description: item.description ?? '',
    photoUrl: item.photoUrl ?? '',
    isActive: item.isActive,
    isVegetarian: item.isVegetarian,
    isVegan: item.isVegan,
    isGlutenFree: item.isGlutenFree,
    containsNuts: item.containsNuts,
    containsDairy: item.containsDairy,
    containsShellfish: item.containsShellfish,
    otherDietaryNotes: item.otherDietaryNotes ?? '',
    sortOrder: item.sortOrder,
  };
}

export const MenuFormDialog = ({
  open,
  onOpenChange,
  item,
  defaultCategory = 'BREAKFAST',
}: Props) => {
  const isEdit = !!item;
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const [form, setForm] = useState<MenuItemDto>(() =>
    formFromItem(item, defaultCategory),
  );
  const [sortText, setSortText] = useState(() =>
    String(formFromItem(item, defaultCategory).sortOrder ?? 0),
  );
  const formSessionKey = `${open}:${item?.id ?? 'new'}:${defaultCategory}`;
  const [activeSessionKey, setActiveSessionKey] = useState(formSessionKey);

  if (formSessionKey !== activeSessionKey) {
    setActiveSessionKey(formSessionKey);
    if (open) {
      const next = formFromItem(item, defaultCategory);
      setForm(next);
      setSortText(String(next.sortOrder ?? 0));
    }
  }

  const set = <K extends keyof MenuItemDto>(key: K, value: MenuItemDto[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isPending = createItem.isPending || updateItem.isPending;

  const handleSubmit = async () => {
    const payload: MenuItemDto = {
      ...form,
      description: form.description || undefined,
      photoUrl: form.photoUrl || undefined,
      otherDietaryNotes: form.otherDietaryNotes || undefined,
    };
    if (isEdit && item) {
      await updateItem.mutateAsync({ id: item.id, dto: payload });
    } else {
      await createItem.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* overflow-x-hidden and the min-w-0 below are load-bearing: DialogContent
          is a grid, and a grid child defaults to min-width:auto — so a long
          unbroken Cloudinary URL pushed the whole dialog wider than the screen
          instead of being truncated by the row that was already asking for it. */}
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogDescription>
            Curate the all-inclusive dining menu shown to guests.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="text-xs font-medium text-manager-text-muted">
                Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Chilaquiles Verdes"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Category
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  const next = v as MenuCategory;
                  setForm((f) => ({
                    ...f,
                    category: next,
                    course: coursesFor(next)[0] ?? null,
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Which allowance the dish counts against. A breakfast main and a
              daily suggestion are two different offers on the same page, and
              filing one as the other is what would let a party pick four
              mains. */}
          {coursesFor(form.category).length > 0 && (
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Course
              </label>
              <Select
                value={form.course ?? coursesFor(form.category)[0]!}
                onValueChange={(v) => set('course', v as MenuCourse)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coursesFor(form.category).map((c) => (
                    <SelectItem key={c} value={c}>
                      {COURSE_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* The only category that carries money. Shown only when it applies,
              so an included dish never gets a price by accident. */}
          {form.category === 'EXCLUSIVE' && (
            <div className="rounded-lg border border-manager-accent bg-[#faf6ee] p-3">
              <label className="text-xs font-medium text-manager-text">
                Price
              </label>
              <p className="mt-0.5 mb-1.5 text-xs text-manager-text-muted">
                Charged to the guest&apos;s folio when the estate confirms the
                order. Everything else on the dining page is included.
              </p>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price ?? ''}
                onChange={(e) =>
                  set(
                    'price',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                placeholder="480.00"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Description
            </label>
            <Textarea
              rows={2}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description shown to guests"
              className="mt-1"
            />
          </div>

          {/* The URL and the upload lead; the photo sits under them at full
              width. A 64px thumbnail beside a Cloudinary URL told you the
              upload had happened and nothing about what you'd uploaded — which
              is the only thing you're checking. Same shape as the room form. */}
          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Photo (optional)
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                type="url"
                value={form.photoUrl ?? ''}
                onChange={(e) => set('photoUrl', e.target.value)}
                placeholder="Upload a photo or paste a URL…"
              />
              <ImageUpload
                folder="menu"
                label="Upload"
                className="shrink-0"
                onUploaded={(url) => set('photoUrl', url)}
              />
            </div>

            {form.photoUrl && (
              <div className="relative mt-2 overflow-hidden rounded-lg border border-manager-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.photoUrl}
                  alt="Dish preview"
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => set('photoUrl', '')}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Remove photo"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-manager-text-muted">
              Dietary
            </label>
            <div className="flex flex-wrap gap-2">
              {DIET_FLAGS.map(({ key, label }) => {
                const active = !!form[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set(key, !active as never)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-manager-accent bg-manager-accent/10 text-manager-text'
                        : 'border-manager-border bg-white text-manager-text-muted hover:border-manager-accent/40',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Other dietary notes
              </label>
              <Input
                value={form.otherDietaryNotes ?? ''}
                onChange={(e) => set('otherDietaryNotes', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-manager-text-muted">
                Sort order
              </label>
              <Input
                type="number"
                value={sortText}
                onChange={(e) => {
                  const v = e.target.value;
                  setSortText(v);
                  set('sortOrder', v === '' ? 0 : Number(v));
                }}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.name.trim()}
          >
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
