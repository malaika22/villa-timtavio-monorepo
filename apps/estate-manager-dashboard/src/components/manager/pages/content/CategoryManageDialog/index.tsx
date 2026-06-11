'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@repo/ui';

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

  const handleDelete = async (category: ExperienceCategory) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Categories with experiences cannot be removed.`,
      )
    ) {
      return;
    }
    await deleteCategory.mutateAsync(category.id);
    if (editing?.id === category.id) resetForm();
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Categories power the filter chips on the experiences catalog.
          </DialogDescription>
        </DialogHeader>

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
                  onClick={() => void handleDelete(category)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
