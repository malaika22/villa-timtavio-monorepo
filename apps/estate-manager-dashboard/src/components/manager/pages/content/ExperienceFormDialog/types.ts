import type { ContentExperience } from '@/types';

export type ExperienceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: ContentExperience | null;
};
