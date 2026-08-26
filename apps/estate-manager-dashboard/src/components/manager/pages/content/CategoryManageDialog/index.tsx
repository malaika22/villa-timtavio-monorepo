'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  useCreateExperienceCategory,
  useDeleteExperienceCategory,
  useExperienceCategories,
  useUpdateExperienceCategory,
} from '@/hooks/useExperienceCategories';
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '@/lib/schemas/category';
import type { ExperienceCategory } from '@repo/api-types';
import {
  EXPERIENCE_GLYPHS,
  EXPERIENCE_GLYPH_LABELS,
  ExperienceGlyphMark,
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CategoryManageDialog = ({ open, onOpenChange }: Props) => {
  const { data: categories = [] } = useExperienceCategories(true);
  const createCategory = useCreateExperienceCategory();
  const updateCategory = useUpdateExperienceCategory();
  const deleteCategory = useDeleteExperienceCategory();
  const [editing, setEditing] = useState<ExperienceCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExperienceCategory | null>(
    null,
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', description: '', glyph: '' },
  });

  const resetForm = () => {
    setEditing(null);
    form.reset({ name: '', description: '', glyph: '' });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (editing) {
      await updateCategory.mutateAsync({
        id: editing.id,
        dto: {
          name: values.name,
          description: values.description,
          // Null, not undefined: undefined is dropped by JSON.stringify and
          // would leave the stored mark in place, so clearing one would
          // silently do nothing.
          glyph: values.glyph || null,
        },
      });
    } else {
      await createCategory.mutateAsync({
        name: values.name,
        description: values.description,
        glyph: values.glyph || null,
      });
    }
    resetForm();
  });

  const startEdit = (category: ExperienceCategory) => {
    setEditing(category);
    form.reset({
      name: category.name,
      description: category.description ?? '',
      glyph: category.glyph ?? '',
    });
  };

  const performDelete = () => {
    if (!confirmDelete) return;
    const category = confirmDelete;
    deleteCategory.mutate(category.id, {
      onSuccess: () => {
        toast.success('Category deleted');
        if (editing?.id === category.id) resetForm();
        setConfirmDelete(null);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : '';
        // The category is already gone (stale list) — treat it as removed;
        // the list refetches via onSettled and the phantom entry disappears.
        if (/not found/i.test(message)) {
          toast.success('Category removed');
          if (editing?.id === category.id) resetForm();
          setConfirmDelete(null);
          return;
        }
        toast.error('Could not delete category', {
          description:
            message || 'Categories with experiences cannot be removed.',
        });
      },
    });
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetForm();
          onOpenChange(next);
        }}
      >
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 border-b border-manager-border px-6 pt-6 pb-4">
            <DialogTitle>Manage categories</DialogTitle>
            <DialogDescription>
              Categories power the filter chips on the experiences catalog.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form
                onSubmit={onSubmit}
                className="space-y-3 border-b border-manager-border pb-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editing ? 'Edit category' : 'New category'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Dining" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Short description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Picked, not derived. Nothing infers a boat from "The
                    Fleet", so the person who names the category is the one
                    who says what it looks like. */}
                <FormField
                  control={form.control}
                  name="glyph"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mark (optional)</FormLabel>
                      <p className="-mt-1 text-xs text-manager-text-muted">
                        Stands in for experiences here that have no photograph
                        yet.
                      </p>
                      <FormControl>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {EXPERIENCE_GLYPHS.map((g) => {
                            const on = field.value === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                title={EXPERIENCE_GLYPH_LABELS[g]}
                                aria-label={EXPERIENCE_GLYPH_LABELS[g]}
                                aria-pressed={on}
                                // Clicking the chosen one clears it, so there
                                // is a way back to no mark without a reset.
                                onClick={() => field.onChange(on ? '' : g)}
                                className={cn(
                                  'flex size-9 items-center justify-center rounded-lg border transition-colors',
                                  on
                                    ? 'border-manager-accent bg-manager-accent/10 text-manager-accent'
                                    : 'border-manager-border bg-white text-manager-text-muted hover:border-manager-accent/40 hover:text-manager-text',
                                )}
                              >
                                <ExperienceGlyphMark
                                  glyph={g}
                                  className="size-5"
                                  strokeWidth={1.6}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  {editing ? (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel edit
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={isPending}>
                    {isPending
                      ? 'Saving…'
                      : editing
                        ? 'Save category'
                        : 'Add category'}
                  </Button>
                </div>
              </form>
            </Form>

            <ul className="space-y-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-manager-border px-3 py-2.5"
                >
                  {/* The mark, so which categories still need one is visible
                      from the list rather than only from opening each. */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg border border-manager-border',
                        category.glyph
                          ? 'text-manager-text'
                          : 'text-manager-text-muted/50',
                      )}
                      title={
                        category.glyph
                          ? EXPERIENCE_GLYPH_LABELS[
                              category.glyph as keyof typeof EXPERIENCE_GLYPH_LABELS
                            ]
                          : 'No mark chosen'
                      }
                    >
                      <ExperienceGlyphMark
                        glyph={category.glyph}
                        className="size-4"
                        strokeWidth={1.6}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-manager-text">
                        {category.name}
                      </p>
                      <p className="text-xs text-manager-text-muted">
                        {category._count?.catalogItems ?? 0} experiences
                        {!category.isActive ? ' · inactive' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => startEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-600 hover:text-red-700"
                      onClick={() => setConfirmDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(next) => !next && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="size-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Remove category?</DialogTitle>
            <DialogDescription className="text-center">
              This removes{' '}
              <span className="font-medium text-manager-text">
                {confirmDelete?.name}
              </span>{' '}
              from the experience filters. Categories that still have
              experiences cannot be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteCategory.isPending}
              onClick={() => setConfirmDelete(null)}
              className="flex-1 border-manager-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteCategory.isPending}
              onClick={performDelete}
              className="flex-1"
            >
              {deleteCategory.isPending ? 'Removing…' : 'Remove category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
