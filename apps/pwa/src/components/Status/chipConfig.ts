import { ExperienceStatus } from '@/types/experienceStatus';

export type StatusRequestKey =
  | ExperienceStatus.READY
  | ExperienceStatus.IN_PROGRESS
  | ExperienceStatus.CONFIRMED
  | ExperienceStatus.PENDING
  | ExperienceStatus.COMPLETED
  | ExperienceStatus.CANCELLED;

export const STATUS_CHIP_CONFIG: Record<
  StatusRequestKey,
  {
    label: string;
    chip: string;
    dot: string;
    cardBorderLeft: string;
  }
> = {
  [ExperienceStatus.READY]: {
    label: 'READY',
    chip: 'border-[#3A5E48] bg-[#3A5E48] text-white',
    dot: 'bg-[#FFFFFF99]',
    cardBorderLeft: 'border-l-[#3A5E48]',
  },
  [ExperienceStatus.IN_PROGRESS]: {
    label: 'IN PROGRESS',
    chip: 'border-[#4E3C6E40] bg-[#4E3C6E24] text-[#4E3C6E]',
    dot: 'bg-[#7B5EA7]',
    cardBorderLeft: 'border-l-[#7B5EA7]',
  },
  [ExperienceStatus.CONFIRMED]: {
    label: 'CONFIRMED',
    chip: 'border-[#3A5E4847] bg-[#3A5E4826] text-[#3A5E48]',
    dot: 'bg-[#3A5E48]',
    cardBorderLeft: 'border-l-[#3A5E4880]',
  },
  [ExperienceStatus.PENDING]: {
    label: 'PENDING',
    chip: 'border-[#C7A0464D] bg-[#C7A04624] text-[#8B6914]',
    dot: 'bg-[#C7A046]',
    cardBorderLeft: 'border-l-[#C7A046]',
  },
  [ExperienceStatus.COMPLETED]: {
    label: 'COMPLETED',
    chip: 'border-[#6b8e6b40] bg-[#6b8e6b1a] text-[#3A5E48]',
    dot: 'bg-[#3A5E48]',
    cardBorderLeft: 'border-l-[#3A5E4860]',
  },
  [ExperienceStatus.CANCELLED]: {
    // EM's "Decline" action lands here — surface the same word to the guest.
    label: 'DECLINED',
    chip: 'border-[#a64b4b40] bg-[#a64b4b1a] text-[#a64b4b]',
    dot: 'bg-[#a64b4b]',
    cardBorderLeft: 'border-l-[#a64b4b60]',
  },
};
