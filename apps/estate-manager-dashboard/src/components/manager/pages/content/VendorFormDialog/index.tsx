'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
} from '@repo/ui';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateVendor } from '@/hooks/useVendors';
import { vendorFormSchema, type VendorFormValues } from '@/lib/schemas/vendor';
import { slugToCatalogCategory } from '@/lib/catalog-category-map';

const CATALOG_CATEGORY_OPTIONS = [
  { value: 'CULINARY_AGAVE', label: 'Culinary & Agave' },
  { value: 'OCEAN_ADVENTURE', label: 'Ocean & Adventure' },
  { value: 'WELLNESS', label: 'Wellness' },
  { value: 'EXCURSIONS', label: 'Excursions' },
  { value: 'ARRIVAL_TRANSIT', label: 'Arrival & Transit' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'INCLUDED', label: 'Included' },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategorySlug?: string;
  onCreated?: (vendorId: string) => void;
};

export const VendorFormDialog = ({
  open,
  onOpenChange,
  defaultCategorySlug = 'culture',
  onCreated,
}: Props) => {
  const createVendor = useCreateVendor();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      category: slugToCatalogCategory(defaultCategorySlug),
      role: '',
      email: '',
      phone: '',
      bio: '',
      notes: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const vendor = await createVendor.mutateAsync({
      name: values.name,
      category: values.category,
      role: values.role,
      email: values.email || undefined,
      phone: values.phone || undefined,
      bio: values.bio || undefined,
      notes: values.notes || undefined,
      status: 'ACTIVE',
    });

    onCreated?.(vendor.id);
    form.reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
          <DialogDescription>
            Create a vendor to assign to experiences in the catalog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ocean Adventures Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service / role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Surf instructor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATALOG_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@vendor.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 555 0100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief vendor description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createVendor.isPending}>
                {createVendor.isPending ? 'Saving…' : 'Add vendor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
