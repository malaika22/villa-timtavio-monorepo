import { z } from 'zod';

export const RELATIONSHIP_VALUES = [
  'partner',
  'family',
  'friend',
  'colleague',
  'other',
] as const;

export const DIETARY_VALUES = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'halal',
  'kosher',
  'no_shellfish',
  'no_nuts',
  'no_dairy',
  'other',
] as const;

export type RelationshipValue = (typeof RELATIONSHIP_VALUES)[number];
export type DietaryValue = (typeof DIETARY_VALUES)[number];

/** RHF + zodResolver: step-2-only rules run when `__step` is 2 */
export const guestManifestSchema = z
  .object({
    __step: z.union([z.literal(1), z.literal(2)]),
    fullName: z.string().min(1, 'Full name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    phone: z.string().optional(),
    relationship: z.enum(RELATIONSHIP_VALUES, {
      message: 'Select a relationship',
    }),
    dateOfBirth: z.string().optional(),
    roomId: z.string(),
    dietaryRestrictions: z.array(z.enum(DIETARY_VALUES)),
    dietaryOtherDetails: z.string().optional(),
    foodAllergies: z.string().optional(),
    beveragePreferences: z.string().optional(),
    specialNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.__step !== 2) return;

    if (!data.roomId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a room',
        path: ['roomId'],
      });
    }

    if (data.dietaryRestrictions.includes('other')) {
      if (!data.dietaryOtherDetails?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please describe this dietary restriction',
          path: ['dietaryOtherDetails'],
        });
      }
    }
  });

export type GuestManifestFormValues = z.infer<typeof guestManifestSchema>;

export const STEP1_TRIGGER_FIELDS = [
  'fullName',
  'email',
  'phone',
  'relationship',
  'dateOfBirth',
] as const;
