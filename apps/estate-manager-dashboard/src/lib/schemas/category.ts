import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
