import { z } from 'zod';

export const BED_TYPE_OPTIONS = [
  { value: 'king', label: 'King bed' },
  { value: 'queen', label: 'Queen bed' },
  { value: 'double', label: 'Double bed' },
  { value: 'twin', label: 'Twin bed' },
  { value: 'single', label: 'Single bed' },
  { value: 'bunk', label: 'Bunk bed' },
  { value: 'sofa', label: 'Sofa bed' },
] as const;

export const AMENITY_OPTIONS = [
  { value: 'balcony', label: 'Balcony' },
  { value: 'ac', label: 'Air conditioning' },
  { value: 'pool_view', label: 'Pool view' },
  { value: 'ocean_view', label: 'Ocean view' },
  { value: 'walk_in_closet', label: 'Walk-in closet' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'smart_tv', label: 'Smart TV' },
  { value: 'minibar', label: 'Minibar' },
] as const;

const bedTypeEnum = z.enum([
  'king',
  'queen',
  'double',
  'twin',
  'single',
  'bunk',
  'sofa',
]);

const amenityEnum = z.enum([
  'balcony',
  'ac',
  'pool_view',
  'ocean_view',
  'walk_in_closet',
  'workspace',
  'smart_tv',
  'minibar',
]);

export const roomFormSchema = z.object({
  number: z.coerce.number().int().min(1, 'Room number is required'),
  name: z.string().min(2, 'Room name is required'),
  type: z.enum(['KING_MASTER_SUITE', 'LUXURY_BUNK_ROOM']),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  bedConfig: z.string().min(1, 'Bed summary is required'),
  beds: z
    .array(
      z.object({
        type: bedTypeEnum,
        count: z.coerce.number().int().min(1, 'Min 1'),
      }),
    )
    .default([]),
  bathrooms: z.coerce.number().int().min(0, 'Cannot be negative'),
  ensuite: z.boolean().default(false),
  amenities: z.array(amenityEnum).default([]),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .url('Enter a valid image URL')
    .optional()
    .or(z.literal('')),
  floorLevel: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;
