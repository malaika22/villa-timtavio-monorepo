import { ExperienceStatus } from '@/types/experienceStatus';

export const ExperienceStatusChipConfig: Record<
  ExperienceStatus,
  { label: string; chip: string; dot: string } | null
> = {
  [ExperienceStatus.CONFIRMED]: {
    label: 'CONFIRMED',
    chip: 'border-[#3A5E4847] bg-[#3A5E4826] text-[#3A5E48]',
    dot: 'bg-[#3A5E48]',
  },
  [ExperienceStatus.IN_PROGRESS]: {
    label: 'IN PROGRESS',
    chip: 'border-[#4E3C6E40] bg-[#4E3C6E24] text-[#4E3C6E]',
    dot: 'bg-[#7B5EA7]',
  },
  [ExperienceStatus.PENDING]: {
    label: 'PENDING',
    chip: 'border-[#C7A0464D] bg-[#C7A04624] text-[#8B6914]',
    dot: 'bg-[#C7A046]',
  },
  [ExperienceStatus.UP_COMING]: {
    label: 'UPCOMING',
    chip: 'border-[#854F0B] bg-[#FAEEDA] text-[#6E4209]',
    dot: 'bg-[#BA7517]',
  },
  [ExperienceStatus.CANCELLED]: {
    label: 'CANCELLED',
    chip: 'border-[#888780] bg-[#F1EFE8] text-[#5F5E5A]',
    dot: 'bg-[#888780]',
  },
  [ExperienceStatus.AVAILABLE]: null,
  [ExperienceStatus.COMPLETED]: {
    label: 'COMPLETED',
    chip: 'border-[#C4C0B8] bg-[#EFEDE8] text-[#5F5E5A]',
    dot: 'bg-[#7A7872]',
  },
  [ExperienceStatus.LOCKED_PRE_ARRIVAL]: null,
};
