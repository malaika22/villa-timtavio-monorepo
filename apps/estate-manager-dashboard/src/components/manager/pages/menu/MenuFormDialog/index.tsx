'use client';

import { useEffect, useState } from 'react';
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
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenu';
import type { MenuCategory, MenuItem, MenuItemDto } from '@repo/api-types';

const CATEGORY_OPTIONS: { value: MenuCategory; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'BEVERAGES', label: 'Beverages' },
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

export const MenuFormDialog = ({
  open,
  onOpenChange,
  item,
  defaultCategory = 'BREAKFAST',
}: Props) => {
  const isEdit = !!item;
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const [form, setForm] = useState<MenuItemDto>(blank(defaultCategory));

  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
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
      });
    } else {
      setForm(blank(defaultCategory));
    }
  }, [open, item, defaultCategory]);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit menu item' : 'Add menu item'}</DialogTitle>
          <DialogDescription>
            Curate the all-inclusive dining menu shown to guests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-manager-text-muted">Name</label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Chilaquiles Verdes"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-manager-text-muted">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => set('category', v as MenuCategory)}
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

          <div>
            <label className="text-xs font-medium text-manager-text-muted">Description</label>
            <Textarea
              rows={2}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description shown to guests"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-manager-text-muted">Photo URL (optional)</label>
            <Input
              type="url"
              value={form.photoUrl ?? ''}
              onChange={(e) => set('photoUrl', e.target.value)}
              placeholder="https://…/dish.jpg"
              className="mt-1"
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
              <label className="text-xs font-medium text-manager-text-muted">Sort order</label>
              <Input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name.trim()}>
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
