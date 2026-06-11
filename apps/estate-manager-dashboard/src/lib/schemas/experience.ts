import { z } from 'zod';

export const experienceFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  experienceCategoryId: z.string().min(1, 'Select a category'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationMinutes: z.number().int().positive('Duration is required'),
  durationLabel: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  isIncluded: z.boolean(),
  vendorId: z.string().optional(),
  primaryPhotoUrl: z.string().optional(),
  maxGuestCount: z.number().int().positive().optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;
