import { Experience, ExperienceDetailData } from '@/types/experience';

export interface ExperienceSheetProps {
  open: boolean;
  experience: Experience;
  detail: ExperienceDetailData;
  preSelectedTimeId: string | null;
  onClose: () => void;
}

export interface GuestStepperProps {
  count: number;
  max: number;
  onChange: (n: number) => void;
}
