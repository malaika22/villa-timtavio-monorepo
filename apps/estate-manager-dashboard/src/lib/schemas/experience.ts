import { z } from 'zod';

export const experienceFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  experienceCategoryId: z.string().min(1, 'Select a category'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationMinutes: z.number().int().positive('Duration is required'),
  durationLabel: z.string().optional(),
  /** Estimated rate — the single estimate, or the low end of a range. */
  basePrice: z.number().min(0).optional(),
  /** High end of an estimate range. Leave empty for a single estimate. */
  priceMax: z.number().min(0).optional(),
  /** Which PriceUnit the rate is quoted in (per person / group / event). */
  priceUnitId: z.string().optional(),
  isIncluded: z.boolean(),
  vendorId: z.string().optional(),
  /** Breezeway person id the setup task routes to (empty = category default) */
  breezeWayTeamId: z.string().optional(),
  primaryPhotoUrl: z.string().optional(),
  /** Full gallery shown on the guest experience detail (includes the primary) */
  photoUrls: z.array(z.string()).optional(),
  maxGuestCount: z.number().int().positive().optional(),
  /** Newline-separated "what's included" list (one item per line) */
  included: z.string().optional(),
  hostName: z.string().optional(),
  hostTitle: z.string().optional(),
  hostAvatarUrl: z.string().optional(),
  hostReviewNote: z.string().optional(),
});

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;
