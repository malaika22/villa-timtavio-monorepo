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
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenu';
import { uploadImage } from '@/lib/upload';
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

  const [uploading, setUploading] = useState(false);

  // Same signed direct-to-Cloudinary upload the experience form uses, so a
  // dish photo doesn't have to be hosted somewhere else first and pasted in.
  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'menu');
      set('photoUrl', url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      // Let the same file be re-picked if the upload failed.
      event.target.value = '';
    }
  };

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </DialogTitle>
          <DialogDescription>
            Curate the all-inclusive dining menu shown to guests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
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

          <div>
            <label className="text-xs font-medium text-manager-text-muted">
              Photo (optional)
            </label>

            {form.photoUrl ? (
              <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-manager-border bg-manager-card p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.photoUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-md object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-xs text-manager-text-muted">
                  {form.photoUrl}
                </span>
                <button
                  type="button"
                  onClick={() => set('photoUrl', '')}
                  className="shrink-0 rounded-md p-1.5 text-manager-text-muted hover:bg-manager-main hover:text-manager-text"
                  aria-label="Remove photo"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  'mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-manager-border bg-manager-card px-3 py-5 text-sm text-manager-text-muted transition-colors hover:border-manager-accent hover:text-manager-text',
                  uploading && 'pointer-events-none opacity-60',
                )}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {uploading ? 'Uploading…' : 'Upload a photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}

            <Input
              type="url"
              value={form.photoUrl ?? ''}
              onChange={(e) => set('photoUrl', e.target.value)}
              placeholder="…or paste an image URL"
              className="mt-2"
            />
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
