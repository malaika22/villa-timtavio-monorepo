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
  Textarea,
} from '@repo/ui';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { toast } from 'sonner';
import type { Recommendation } from '@repo/api-types';

import {
  useCreateRecommendation,
  useUpdateRecommendation,
} from '@/hooks/useCatalogAdmin';

export const RecommendationFormDialog = ({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Recommendation | null;
}) => {
  const create = useCreateRecommendation();
  const update = useUpdateRecommendation();
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState({
    name: '',
    category: '',
    location: '',
    description: '',
    photoUrl: '',
    externalUrl: '',
    isFeatured: false,
    sortOrder: 0,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name ?? '',
        category: editing?.category ?? '',
        location: editing?.location ?? '',
        description: editing?.description ?? '',
        photoUrl: editing?.photoUrl ?? '',
        externalUrl: editing?.externalUrl ?? '',
        isFeatured: editing?.isFeatured ?? false,
        sortOrder: editing?.sortOrder ?? 0,
      });
    }
  }, [open, editing]);

  const set = (k: keyof typeof form, v: string | boolean | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid = form.name.trim() && form.category.trim();

  const submit = () => {
    if (!valid) return;
    const data = {
      name: form.name.trim(),
      category: form.category.trim(),
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      photoUrl: form.photoUrl.trim() || undefined,
      externalUrl: form.externalUrl.trim() || undefined,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder) || 0,
    };
    const onDone = {
      onSuccess: () => {
        toast.success(editing ? 'Recommendation updated' : 'Recommendation added');
        onOpenChange(false);
      },
      onError: (e: unknown) => toast.error((e as Error).message),
    };
    if (editing) update.mutate({ id: editing.id, data }, onDone);
    else create.mutate(data, onDone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit recommendation' : 'Add recommendation'}
          </DialogTitle>
          <DialogDescription>
            Off-site restaurants and excursions shown to guests.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input placeholder="Category" value={form.category} onChange={(e) => set('category', e.target.value)} />
          <Input placeholder="Location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Input
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', Number(e.target.value))}
          />
          <Input className="sm:col-span-2" placeholder="Photo URL" value={form.photoUrl} onChange={(e) => set('photoUrl', e.target.value)} />
          <Input className="sm:col-span-2" placeholder="External URL" value={form.externalUrl} onChange={(e) => set('externalUrl', e.target.value)} />
          <Textarea
            className="sm:col-span-2"
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <button
            type="button"
            onClick={() => set('isFeatured', !form.isFeatured)}
            className={cn(
              'sm:col-span-2 inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm transition-colors',
              form.isFeatured
                ? 'border-[#c7a046] bg-[#fdf3e3] text-[#8b6914]'
                : 'border-manager-border text-manager-text-muted',
            )}
          >
            <Star className={cn('size-3.5', form.isFeatured && 'fill-current')} />
            Featured
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-manager-accent text-white hover:bg-manager-accent-muted"
            disabled={!valid || pending}
            onClick={submit}
          >
            {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            {editing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
