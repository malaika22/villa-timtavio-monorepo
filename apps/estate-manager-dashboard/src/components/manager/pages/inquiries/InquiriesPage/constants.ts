import type { InquiryStatus } from '@repo/api-types';

export const STATUS_PILL: Record<
  InquiryStatus,
  { label: string; classes: string }
> = {
  NEW: {
    label: 'New',
    classes: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  APPROVED: {
    label: 'Approved',
    classes: 'bg-green-50 text-green-700 border border-green-200',
  },
  DECLINED: {
    label: 'Declined',
    classes: 'bg-red-50 text-red-600 border border-red-200',
  },
  CONVERTED: {
    label: 'Converted',
    classes: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
};

export const PURPOSE_LABEL: Record<string, string> = {
  CORPORATE_RETREAT: 'Corporate Retreat',
  FAMILY: 'Family',
  WEDDING: 'Wedding',
  CONTENT_PRODUCTION: 'Content Production',
  OTHER: 'Other',
};
