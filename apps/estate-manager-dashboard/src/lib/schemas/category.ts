import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
  /**
   * Empty means "no mark chosen", which the guest app draws as a neutral one.
   * Not required: naming a category shouldn't wait on picking a drawing.
   */
  glyph: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
