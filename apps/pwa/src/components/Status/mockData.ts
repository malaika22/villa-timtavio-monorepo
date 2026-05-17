import { ExperienceStatus } from '@/types/experienceStatus';
import type { StatusRequestKey } from './chipConfig';
import { StatusTabId } from './type';

export interface StatusRequest {
  id: number;
  title: string;
  /** Display string, e.g. "TODAY", "TOMORROW", "MAR 22" */
  date: string;
  /** Display string, e.g. "7:00 PM" */
  time: string;
  /** Third meta segment, e.g. "3 HRS", "CHEF MARIA", "WINE CELLAR", "AWAITING CONFIRMATION" */
  meta: string;
  status: StatusRequestKey;
  /** Optional body text shown below the meta line */
  description?: string;
  /** Whether to show a "View details →" link */
  showViewDetails?: boolean;
  /** 0–100, present when status is IN_PROGRESS */
  progressPercent?: number;
  /** Progress bar label, e.g. "STAFF PREPARING · ETA 2:15 PM" */
  progressLabel?: string;
  /** Which tabs this request should appear in */
  tabs: StatusTabId[];
}

export const STATUS_MOCK_DATA: StatusRequest[] = [
  {
    id: 1,
    title: 'Pool Exclusive',
    date: 'TODAY',
    time: '7:00 PM',
    meta: '3 HRS',
    status: ExperienceStatus.READY,
    description: 'Staff preparing now — setup complete.',
    showViewDetails: true,
    tabs: ['active', 'all', 'today'],
  },
  {
    id: 2,
    title: "Chef's Table",
    date: 'TODAY',
    time: '2:00 PM',
    meta: 'CHEF MARIA',
    status: ExperienceStatus.IN_PROGRESS,
    progressPercent: 65,
    progressLabel: 'STAFF PREPARING · ETA 2:15 PM',
    tabs: ['active', 'all', 'today'],
  },
  {
    id: 3,
    title: 'Wine Vault Evening',
    date: 'TOMORROW',
    time: '7:00 PM',
    meta: 'WINE CELLAR',
    status: ExperienceStatus.CONFIRMED,
    tabs: ['active', 'all'],
  },
  {
    id: 4,
    title: 'Private Spa Ritual',
    date: 'MAR 22',
    time: '10:00 AM',
    meta: 'AWAITING CONFIRMATION',
    status: ExperienceStatus.PENDING,
    tabs: ['all'],
  },
];
