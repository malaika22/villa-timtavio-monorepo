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

export type RequestTimelineStepState = 'completed' | 'active' | 'pending';

export interface RequestTimelineStep {
  id: string;
  label: string;
  /** Optional subtitle shown beneath the label */
  detail?: string;
  state: RequestTimelineStepState;
}

export interface RequestDetail {
  id: number;
  /** Thumbnail image path */
  image?: string;
  timeline: RequestTimelineStep[];
  /** Placeholder text shown over the dark setup preview area */
  setupPreviewPlaceholder?: string;
  /** Attribution line below the preview, e.g. "SETUP BY MARIA L. · PHOTO UPLOADED ON COMPLETION" */
  setupBy?: string;
  folioLabel?: string;
  folioCharge?: number;
  contactPhone?: string;
  contactWhatsApp?: string;
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

export const REQUEST_DETAIL_MOCK_DATA: Record<number, RequestDetail> = {
  1: {
    id: 1,
    image: '/images/experience.png',
    timeline: [
      {
        id: 'submitted',
        label: 'Submitted',
        detail: 'MAR 20 · 4:12 PM',
        state: 'completed',
      },
      {
        id: 'under-review',
        label: 'Under Review',
        detail: 'ESTATE MANAGER REVIEWING',
        state: 'completed',
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        detail: 'MAR 20 · 5:30 PM · CONFIRMED FOR 7PM',
        state: 'completed',
      },
      {
        id: 'preparation-started',
        label: 'Preparation Started',
        detail: 'STAFF ON SITE · ETA 6:45 PM',
        state: 'active',
      },
      {
        id: 'ready',
        label: 'Ready',
        detail: "YOU'LL BE NOTIFIED",
        state: 'pending',
      },
      {
        id: 'completed',
        label: 'Completed',
        state: 'pending',
      },
    ],
    setupPreviewPlaceholder: 'PHOTO WILL APPEAR WHEN READY',
    setupBy: 'SETUP BY ESTATE TEAM · PHOTO UPLOADED ON COMPLETION',
    folioLabel: 'Folio charge on completion',
    folioCharge: 300,
    contactPhone: '+34 600 000 001',
    contactWhatsApp: '+34 600 000 001',
  },
  2: {
    id: 2,
    image: '/images/experience.png',
    timeline: [
      {
        id: 'submitted',
        label: 'Submitted',
        detail: 'MAR 20 · 4:12 PM',
        state: 'completed',
      },
      {
        id: 'under-review',
        label: 'Under Review',
        detail: 'ESTATE MANAGER REVIEWING',
        state: 'completed',
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        detail: 'MAR 20 · 5:30 PM · CONFIRMED FOR 6PM',
        state: 'completed',
      },
      {
        id: 'preparation-started',
        label: 'Preparation Started',
        detail: 'CHEF MARIA ON SITE · ETA 2:15 PM',
        state: 'active',
      },
      {
        id: 'ready',
        label: 'Ready',
        detail: "YOU'LL BE NOTIFIED",
        state: 'pending',
      },
      {
        id: 'completed',
        label: 'Completed',
        state: 'pending',
      },
    ],
    setupPreviewPlaceholder: 'PHOTO WILL APPEAR WHEN READY',
    setupBy: 'SETUP BY MARIA L. · PHOTO UPLOADED ON COMPLETION',
    folioLabel: 'Folio charge on completion',
    folioCharge: 450,
    contactPhone: '+34 600 000 001',
    contactWhatsApp: '+34 600 000 001',
  },
  3: {
    id: 3,
    image: '/images/experience.png',
    timeline: [
      {
        id: 'submitted',
        label: 'Submitted',
        detail: 'MAR 20 · 6:00 PM',
        state: 'completed',
      },
      {
        id: 'under-review',
        label: 'Under Review',
        detail: 'ESTATE MANAGER REVIEWING',
        state: 'completed',
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        detail: 'MAR 20 · 7:00 PM · CONFIRMED FOR TOMORROW',
        state: 'active',
      },
      {
        id: 'preparation-started',
        label: 'Preparation Started',
        state: 'pending',
      },
      {
        id: 'ready',
        label: 'Ready',
        state: 'pending',
      },
      {
        id: 'completed',
        label: 'Completed',
        state: 'pending',
      },
    ],
    setupPreviewPlaceholder: 'PHOTO WILL APPEAR WHEN READY',
    setupBy: 'SETUP BY WINE CELLAR TEAM · PHOTO UPLOADED ON COMPLETION',
    folioLabel: 'Folio charge on completion',
    folioCharge: 120,
    contactPhone: '+34 600 000 001',
    contactWhatsApp: '+34 600 000 001',
  },
  4: {
    id: 4,
    image: '/images/experience.png',
    timeline: [
      {
        id: 'submitted',
        label: 'Submitted',
        detail: 'MAR 19 · 3:00 PM',
        state: 'completed',
      },
      {
        id: 'under-review',
        label: 'Under Review',
        detail: 'ESTATE MANAGER REVIEWING',
        state: 'active',
      },
      {
        id: 'confirmed',
        label: 'Confirmed',
        state: 'pending',
      },
      {
        id: 'preparation-started',
        label: 'Preparation Started',
        state: 'pending',
      },
      {
        id: 'ready',
        label: 'Ready',
        state: 'pending',
      },
      {
        id: 'completed',
        label: 'Completed',
        state: 'pending',
      },
    ],
    setupPreviewPlaceholder: 'PHOTO WILL APPEAR WHEN READY',
    setupBy: 'SETUP BY SPA TEAM · PHOTO UPLOADED ON COMPLETION',
    folioLabel: 'Folio charge on completion',
    folioCharge: 280,
    contactPhone: '+34 600 000 001',
    contactWhatsApp: '+34 600 000 001',
  },
};
