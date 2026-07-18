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
} from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CatalogCategory, CreateVendorDto } from '@repo/api-types';

import { useCreateVendor } from '@/hooks/useVendors';

const CATEGORIES: { value: CatalogCategory; label: string }[] = [
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'CULINARY_AGAVE', label: 'Culinary' },
  { value: 'OCEAN_ADVENTURE', label: 'Ocean & Adventure' },
  { value: 'EXCURSIONS', label: 'Excursions' },
  { value: 'ARRIVAL_TRANSIT', label: 'Arrival & Transit' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'INCLUDED', label: 'Included' },
];

export const AddVendorDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const create = useCreateVendor();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<CatalogCategory>('WELLNESS');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const valid = name.trim() && role.trim();

  const reset = () => {
    setName('');
    setRole('');
    setCategory('WELLNESS');
    setEmail('');
    setPhone('');
  };

  const submit = () => {
    if (!valid) return;
    const dto: CreateVendorDto = {
      name: name.trim(),
      role: role.trim(),
      category,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    create.mutate(dto, {
      onSuccess: () => {
        toast.success('Vendor added');
        reset();
        onOpenChange(false);
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
          <DialogDescription>
            New providers appear in the directory immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Role (e.g. Private Chef)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  category === c.value
                    ? 'border-manager-accent bg-manager-accent/10 text-manager-text'
                    : 'border-manager-border text-manager-text-muted hover:text-manager-text',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Input
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-manager-accent text-white hover:bg-manager-accent-muted"
            disabled={!valid || create.isPending}
            onClick={submit}
          >
            {create.isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : null}
            Add vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
