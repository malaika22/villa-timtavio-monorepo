import { ExperienceStatus } from '@/types/experienceStatus';

export type ScheduleEvent = {
  id: string;
  scheduledTime: string;
  title: string;
  location?: string;
  status: ExperienceStatus;
};

export const SCHEDULE_LIST_MOCK: ScheduleEvent[] = [
  {
    id: '1',
    scheduledTime: '2026-05-10T14:37:52.483Z',
    title: "Chef's Table Dinner",
    status: ExperienceStatus.CONFIRMED,
    location: 'ESTATE DINING TERRACE',
  },
  {
    id: '2',
    scheduledTime: '2026-05-10T14:00:00.000Z',
    title: 'Private Pool Exclusive',
    status: ExperienceStatus.IN_PROGRESS,
    location: 'POOL OLIVE DECK',
  },
  {
    id: '3',
    scheduledTime: '2026-05-26T08:30:00.000Z',
    title: 'Estate Winery Tasting',
    status: ExperienceStatus.PENDING,
    location: 'ESTATE WINERY',
  },
  {
    id: '4',
    scheduledTime: '2026-05-29T14:00:00.000Z',
    title: 'Sunset Aperitivo',
    status: ExperienceStatus.CONFIRMED,
    location: 'VILLA TIMTAVIO',
  },
];
