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
    defaultValues: { name: '', description: '' },
  });

  const resetForm = () => {
    setEditing(null);
    form.reset({ name: '', description: '' });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (editing) {
      await updateCategory.mutateAsync({
        id: editing.id,
        dto: {
          name: values.name,
          description: values.description,
        },
      });
    } else {
      await createCategory.mutateAsync({
        name: values.name,
        description: values.description,
      });
    }
    resetForm();
  });

  const startEdit = (category: ExperienceCategory) => {
    setEditing(category);
    form.reset({
      name: category.name,
      description: category.description ?? '',
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
        toast.error('Could not delete category', {
          description:
            error instanceof Error
              ? error.message
              : 'Categories with experiences cannot be removed.',
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
                  <div>
                    <p className="text-sm font-medium text-manager-text">
                      {category.name}
                    </p>
                    <p className="text-xs text-manager-text-muted">
                      {category._count?.catalogItems ?? 0} experiences
                      {!category.isActive ? ' · inactive' : ''}
                    </p>
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
