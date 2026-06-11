import { z } from 'zod';

const catalogCategoryEnum = z.enum([
  'INCLUDED',
  'ARRIVAL_TRANSIT',
  'WELLNESS',
  'CULINARY_AGAVE',
  'OCEAN_ADVENTURE',
  'EXCURSIONS',
  'PRIVATE',
]);

export const vendorFormSchema = z.object({
  name: z.string().min(2, 'Vendor name is required'),
  category: catalogCategoryEnum,
  role: z.string().min(2, 'Role or service type is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  bio: z.string().optional(),
  notes: z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
