import type { ScheduleItem } from '@/types';

export const defaultDot: Record<ScheduleItem['variant'], string> = {
  default: 'bg-[#6b6560]',
  confirmed: 'bg-[#1e7e34]',
  pending: 'bg-[#d4a373]',
  conflict: 'bg-[#c53030]',
};
