'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { ImagePlus, Plus, Star, X } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
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
import { toast } from 'sonner';
import { uploadImage } from '@/lib/upload';
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
  const [uploadingImage, setUploadingImage] = useState(false);

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
      photoUrls: [],
      maxGuestCount: undefined,
      included: '',
      hostName: '',
      hostTitle: '',
      hostAvatarUrl: '',
      hostReviewNote: '',
    },
  });

  const experienceCategoryId = useWatch({
    control: form.control,
    name: 'experienceCategoryId',
  });

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === experienceCategoryId),
    [categories, experienceCategoryId],
  );

  const formSessionKey = `${open}:${experience?.id ?? 'new'}:${defaultCategoryId}`;
  const [activeSessionKey, setActiveSessionKey] = useState(formSessionKey);

  if (open && formSessionKey !== activeSessionKey) {
    setActiveSessionKey(formSessionKey);
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
        photoUrls:
          experience.photoUrls && experience.photoUrls.length > 0
            ? experience.photoUrls
            : experience.primaryPhotoUrl
              ? [experience.primaryPhotoUrl]
              : [],
        maxGuestCount: experience.maxGuestCount ?? undefined,
        included: (experience.included ?? []).join('\n'),
        hostName: experience.hostName ?? '',
        hostTitle: experience.hostTitle ?? '',
        hostAvatarUrl: experience.hostAvatarUrl ?? '',
        hostReviewNote: experience.hostReviewNote ?? '',
      });
    } else {
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
        photoUrls: [],
      });
    }
  }

  const isIncluded = useWatch({ control: form.control, name: 'isIncluded' });

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
      photoUrls: values.photoUrls ?? [],
      // The primary is always one of the gallery images; fall back to the first.
      primaryPhotoUrl:
        values.primaryPhotoUrl || values.photoUrls?.[0] || undefined,
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

  const photoUrls = useWatch({ control: form.control, name: 'photoUrls' }) ?? [];
  const primaryPhotoUrl =
    useWatch({ control: form.control, name: 'primaryPhotoUrl' }) ?? '';

  const handleImagesChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const urls = await Promise.all(
        files.map((file) => uploadImage(file, 'experiences')),
      );
      const next = [...photoUrls, ...urls];
      form.setValue('photoUrls', next, { shouldValidate: true });
      // First image uploaded becomes the primary/cover by default.
      if (!primaryPhotoUrl && next.length > 0) {
        form.setValue('primaryPhotoUrl', next[0], { shouldValidate: true });
      }
      toast.success(
        `${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const removeImage = (url: string) => {
    const next = photoUrls.filter((u) => u !== url);
    form.setValue('photoUrls', next, { shouldValidate: true });
    if (primaryPhotoUrl === url) {
      form.setValue('primaryPhotoUrl', next[0] ?? '', { shouldValidate: true });
    }
  };

  const setPrimary = (url: string) =>
    form.setValue('primaryPhotoUrl', url, { shouldValidate: true });

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
                <FormLabel>Experience images</FormLabel>
                <div className="flex flex-wrap gap-3">
                  {photoUrls.map((url) => {
                    const isPrimary = url === primaryPhotoUrl;
                    return (
                      <div
                        key={url}
                        className={cn(
                          'group relative size-24 overflow-hidden rounded-lg border bg-[#faf8f5]',
                          isPrimary
                            ? 'border-manager-accent ring-2 ring-manager-accent/40'
                            : 'border-manager-border',
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Experience"
                          className="size-full object-cover"
                        />
                        {isPrimary ? (
                          <span className="absolute inset-x-0 bottom-0 bg-manager-accent/90 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
                            Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimary(url)}
                            title="Set as primary"
                            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Star className="size-3" /> Set primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          title="Remove image"
                          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    );
                  })}

                  <label
                    className={cn(
                      'flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-manager-border bg-[#faf8f5] text-manager-text-muted transition-colors hover:border-manager-accent/50',
                      uploadingImage && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <ImagePlus className="size-6" />
                    <span className="text-[10px]">
                      {uploadingImage ? 'Uploading…' : 'Add images'}
                    </span>
                  </label>
                </div>
                <FormDescription>
                  Upload one or more photos. The image marked{' '}
                  <span className="font-medium">Primary</span> is the card cover;
                  the rest form the guest gallery.
                </FormDescription>
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
                      Who Breezeway assigns this experience&apos;s setup task
                      to. Leave as default to use the category&apos;s fallback
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
                          <Input
                            placeholder="e.g. Chef Maria Lopez"
                            {...field}
                          />
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
