'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ImagePlus, Plus } from 'lucide-react';
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

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { VendorFormDialog } from '@/components/manager/pages/content/VendorFormDialog';
import {
  useCreateCatalogItem,
  useUpdateCatalogItem,
} from '@/hooks/useCatalogAdmin';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { useVendors } from '@/hooks/useVendors';
import { useBreezewayStaff } from '@/hooks/useBreezewayStaff';
import {
  formatDurationLabel,
  slugToCatalogCategory,
} from '@/lib/catalog-category-map';
import {
  experienceFormSchema,
  type ExperienceFormValues,
} from '@/lib/schemas/experience';
import { readImageFile } from './helpers';
import { ExperienceFormDialogProps } from './types';

export const ExperienceFormDialog = ({
  open,
  onOpenChange,
  experience,
}: ExperienceFormDialogProps) => {
  const isEditing = Boolean(experience?.id);
  const { data: categories = [] } = useExperienceCategories();
  const { data: vendors = [] } = useVendors();
  const { data: staff = [] } = useBreezewayStaff();
  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const defaultCategoryId = categories[0]?.id ?? '';

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      name: '',
      experienceCategoryId: defaultCategoryId,
      description: '',
      durationMinutes: 60,
      durationLabel: '1 hr',
      basePrice: undefined,
      isIncluded: false,
      vendorId: '',
      breezeWayTeamId: '',
      primaryPhotoUrl: '',
      maxGuestCount: undefined,
      included: '',
      hostName: '',
      hostTitle: '',
      hostAvatarUrl: '',
      hostReviewNote: '',
    },
  });

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => category.id === form.watch('experienceCategoryId'),
      ),
    [categories, form],
  );

  useEffect(() => {
    if (!open) return;

    if (experience) {
      form.reset({
        name: experience.name,
        experienceCategoryId:
          experience.experienceCategoryId ?? defaultCategoryId,
        description: experience.description ?? '',
        durationMinutes: experience.durationMinutes ?? 60,
        durationLabel: experience.duration,
        basePrice: experience.basePrice ?? undefined,
        isIncluded: experience.pricing === 'included',
        vendorId: experience.vendorId ?? '',
        breezeWayTeamId: experience.breezeWayTeamId ?? '',
        primaryPhotoUrl: experience.primaryPhotoUrl ?? '',
        maxGuestCount: experience.maxGuestCount ?? undefined,
        included: (experience.included ?? []).join('\n'),
        hostName: experience.hostName ?? '',
        hostTitle: experience.hostTitle ?? '',
        hostAvatarUrl: experience.hostAvatarUrl ?? '',
        hostReviewNote: experience.hostReviewNote ?? '',
      });
      setImagePreview(experience.primaryPhotoUrl ?? null);
      return;
    }

    form.reset({
      name: '',
      experienceCategoryId: defaultCategoryId,
      description: '',
      durationMinutes: 60,
      durationLabel: '1 hr',
      basePrice: undefined,
      isIncluded: false,
      vendorId: '',
      breezeWayTeamId: '',
      primaryPhotoUrl: '',
      maxGuestCount: undefined,
      included: '',
      hostName: '',
      hostTitle: '',
      hostAvatarUrl: '',
      hostReviewNote: '',
    });
    setImagePreview(null);
  }, [open, experience, form, defaultCategoryId]);

  const isIncluded = form.watch('isIncluded');

  const onSubmit = form.handleSubmit(async (values) => {
    const category = categories.find(
      (item) => item.id === values.experienceCategoryId,
    );
    const durationLabel =
      values.durationLabel || formatDurationLabel(values.durationMinutes);

    const payload = {
      name: values.name,
      category: slugToCatalogCategory(category?.slug ?? 'culture'),
      experienceCategoryId: values.experienceCategoryId,
      description: values.description,
      durationMinutes: values.durationMinutes,
      durationLabel,
      basePrice: values.isIncluded ? undefined : values.basePrice,
      isIncluded: values.isIncluded,
      vendorId: values.vendorId || undefined,
      breezeWayTeamId: values.breezeWayTeamId || undefined,
      primaryPhotoUrl: values.primaryPhotoUrl || undefined,
      maxGuestCount: values.maxGuestCount,
      included: (values.included ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      hostName: values.hostName || undefined,
      hostTitle: values.hostTitle || undefined,
      hostAvatarUrl: values.hostAvatarUrl || undefined,
      hostReviewNote: values.hostReviewNote || undefined,
      isActive: true,
    };

    if (isEditing && experience) {
      await updateItem.mutateAsync({ id: experience.id, dto: payload });
    } else {
      await createItem.mutateAsync(payload);
    }

    onOpenChange(false);
  });

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readImageFile(file);
    form.setValue('primaryPhotoUrl', dataUrl, { shouldValidate: true });
    setImagePreview(dataUrl);
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit experience' : 'Add experience'}
            </DialogTitle>
            <DialogDescription>
              Configure the experience details shown in the guest catalog.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chef's Table" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceCategoryId"
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
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Experience image</FormLabel>
                <div className="flex items-start gap-4">
                  <div className="flex size-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-manager-border bg-[#faf8f5]">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt="Experience preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="size-6 text-manager-text-muted" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <FormDescription>
                      Upload a cover image for this experience card.
                    </FormDescription>
                  </div>
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe the experience for estate managers and guests"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxGuestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max guests</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isIncluded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === 'included')
                      }
                      value={field.value ? 'included' : 'chargeable'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="included">
                          Included (complimentary)
                        </SelectItem>
                        <SelectItem value="chargeable">Chargeable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isIncluded ? (
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Reference price for estate managers. Lodgify manages
                        guest billing.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Vendor</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setVendorDialogOpen(true)}
                      >
                        <Plus className="size-3.5" />
                        Add vendor
                      </Button>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name} · {vendor.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breezeWayTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned staff (Breezeway)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === '__default__' ? '' : value)
                      }
                      value={field.value ? field.value : '__default__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Category default" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__default__">
                          Category default (unassigned)
                        </SelectItem>
                        {staff.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                            {person.department ? ` · ${person.department}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Who Breezeway assigns this experience&apos;s setup task to.
                      Leave as default to use the category&apos;s fallback
                      assignee.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What&apos;s included</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={
                          'One item per line, e.g.\n8-course tasting menu\nWine pairing from private cellar\nSetup & service by estate staff'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown as a bulleted list on the guest experience detail.
                      One item per line.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-manager-border bg-[#faf9f7] p-4">
                <p className="mb-3 text-sm font-medium text-manager-text">
                  Host (optional)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="hostName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Chef Maria Lopez" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hostTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Private Chef" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="mt-3 space-y-3">
                  <FormField
                    control={form.control}
                    name="hostAvatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://…/host.jpg"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hostReviewNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review note</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 4.9★ from past guests"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? 'Saving…'
                    : isEditing
                      ? 'Save changes'
                      : 'Add experience'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <VendorFormDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        defaultCategorySlug={selectedCategory?.slug}
        onCreated={(vendorId) => {
          form.setValue('vendorId', vendorId, { shouldValidate: true });
        }}
      />
    </>
  );
};
