'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateRoom, useUpdateRoom } from '@/hooks/useRooms';
import {
  AMENITY_OPTIONS,
  BED_TYPE_OPTIONS,
  roomFormSchema,
  type RoomFormValues,
} from '@/lib/schemas/room';
import type { Room, RoomAmenity, UpdateRoomDto } from '@repo/api-types';

const ROOM_TYPE_OPTIONS = [
  { value: 'KING_MASTER_SUITE', label: 'King Master Suite' },
  { value: 'LUXURY_BUNK_ROOM', label: 'Luxury Bunk Room' },
] as const;

const BLANK: RoomFormValues = {
  number: 0,
  name: '',
  type: 'KING_MASTER_SUITE',
  capacity: 2,
  bedConfig: '',
  beds: [{ type: 'king', count: 1 }],
  bathrooms: 1,
  ensuite: false,
  amenities: [],
  description: '',
  imageUrl: '',
  floorLevel: 1,
  isActive: true,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog is in edit mode */
  room?: Room | null;
};

export const RoomFormDialog = ({ open, onOpenChange, room }: Props) => {
  const isEdit = !!room;
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const form = useForm<RoomFormValues>({
    // zod's coerce makes the schema input type differ from output; the runtime
    // resolver is correct, so we cast to the output-typed resolver.
    resolver: zodResolver(
      roomFormSchema,
    ) as unknown as Resolver<RoomFormValues>,
    defaultValues: BLANK,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'beds',
  });

  // Reset values whenever the dialog opens (edit prefill or blank for create)
  const formSessionKey = `${open}:${room?.number ?? 'new'}`;
  const [activeSessionKey, setActiveSessionKey] = useState(formSessionKey);

  if (open && formSessionKey !== activeSessionKey) {
    setActiveSessionKey(formSessionKey);
    if (room) {
      form.reset({
        number: room.number,
        name: room.name,
        type: room.type as RoomFormValues['type'],
        capacity: room.capacity,
        bedConfig: room.bedConfig,
        beds: room.beds?.length ? room.beds : [{ type: 'king', count: 1 }],
        bathrooms: room.bathrooms,
        ensuite: room.ensuite,
        amenities: room.amenities ?? [],
        description: room.description ?? '',
        imageUrl: room.imageUrl ?? '',
        floorLevel: room.floorLevel ?? undefined,
        isActive: room.isActive,
      });
    } else {
      form.reset(BLANK);
    }
  } else if (!open && activeSessionKey !== 'closed') {
    // Re-arm on close so the next open always resets — even for another blank
    // "new" room, whose key ("true:new") would otherwise match the previous
    // session and skip the reset, leaving the old room's data in the form.
    setActiveSessionKey('closed');
  }

  const amenities = useWatch({ control: form.control, name: 'amenities' });
  const ensuite = useWatch({ control: form.control, name: 'ensuite' });
  const isActive = useWatch({ control: form.control, name: 'isActive' });
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });
  const beds = useWatch({ control: form.control, name: 'beds' });

  const toggleAmenity = (value: RoomAmenity) => {
    const next = amenities.includes(value)
      ? amenities.filter((a) => a !== value)
      : [...amenities, value];
    form.setValue('amenities', next, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      type: values.type,
      capacity: values.capacity,
      bedConfig: values.bedConfig,
      beds: values.beds,
      bathrooms: values.bathrooms,
      ensuite: values.ensuite,
      amenities: values.amenities,
      description: values.description || undefined,
      imageUrl: values.imageUrl || undefined,
      floorLevel: values.floorLevel,
    };

    if (isEdit && room) {
      await updateRoom.mutateAsync({
        number: room.number,
        dto: { ...payload, isActive: values.isActive } as UpdateRoomDto,
      });
    } else {
      await createRoom.mutateAsync({ number: values.number, ...payload });
    }

    onOpenChange(false);
  });

  const isPending = createRoom.isPending || updateRoom.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Room ${room.number}` : 'Add room'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update room details shown to guests during manifest setup.'
              : 'Create a room that guests can be assigned to.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room number</FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isEdit} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floorLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. King Master Suite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROOM_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
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
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sleeps (capacity)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Beds editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Beds</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => append({ type: 'twin', count: 1 })}
                >
                  <Plus className="size-3" /> Add bed
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((f, index) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Select
                      value={beds?.[index]?.type}
                      onValueChange={(v) =>
                        form.setValue(
                          `beds.${index}.type`,
                          v as RoomFormValues['beds'][number]['type'],
                          { shouldDirty: true },
                        )
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BED_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-20"
                      {...form.register(`beds.${index}.count`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 shrink-0 text-manager-text-muted hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="bedConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed summary (short label)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 1 Queen + 2 Twin bunks"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bathrooms + ensuite */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col justify-end">
                <FormLabel className="mb-2">Ensuite</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setValue('ensuite', !ensuite, { shouldDirty: true })
                  }
                  className={cn(
                    'justify-start',
                    ensuite && 'border-manager-accent bg-manager-accent/10',
                  )}
                >
                  {ensuite ? 'Ensuite bathroom' : 'Shared / not ensuite'}
                </Button>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <FormLabel>Amenities</FormLabel>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((o) => {
                  const active = amenities.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleAmenity(o.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-manager-accent bg-manager-accent/10 text-manager-text'
                          : 'border-manager-border bg-white text-manager-text-muted hover:border-manager-accent/40',
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Brief description shown to guests"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room image (optional) */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room image URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://…/room-photo.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {imageUrl ? (
                    <div className="mt-2 overflow-hidden rounded-lg border border-manager-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Room preview"
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            'none';
                        }}
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-manager-text-muted">
                      Paste an image URL to show guests a photo of the room.
                    </p>
                  )}
                </FormItem>
              )}
            />

            {isEdit && (
              <div className="flex items-center justify-between rounded-lg border border-manager-border bg-[#faf9f7] px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-manager-text">
                    Room active
                  </p>
                  <p className="text-xs text-manager-text-muted">
                    Inactive rooms are hidden from guest assignment.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form.setValue('isActive', !isActive, { shouldDirty: true })
                  }
                  className={cn(
                    isActive
                      ? 'border-green-600/40 bg-green-50 text-green-700'
                      : 'border-manager-border text-manager-text-muted',
                  )}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
