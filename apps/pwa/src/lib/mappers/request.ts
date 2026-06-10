import type { ExperienceRequest, RequestStatus } from '@repo/api-types';
import type {
  StatusRequest,
  RequestTimelineStep,
} from '@/components/Status/mockData';
import { ExperienceStatus } from '@/types/experienceStatus';
import type { StatusTabId } from '@/components/Status/type';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

const STATUS_MAP: Record<RequestStatus, ExperienceStatus> = {
  PENDING: ExperienceStatus.PENDING,
  CONFIRMED: ExperienceStatus.CONFIRMED,
  IN_PROGRESS: ExperienceStatus.IN_PROGRESS,
  READY: ExperienceStatus.READY,
  COMPLETED: ExperienceStatus.COMPLETED,
  CANCELLED: ExperienceStatus.CANCELLED,
};

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'TODAY';
  if (isTomorrow(date)) return 'TOMORROW';
  return format(date, 'MMM d').toUpperCase();
}

function getTabsForStatus(status: RequestStatus): StatusTabId[] {
  const active: StatusTabId[] = ['active', 'all'];

  switch (status) {
    case 'CONFIRMED':
    case 'IN_PROGRESS':
    case 'READY':
      return active;
    case 'PENDING':
      return ['all'];
    default:
      return ['all'];
  }
}

export function mapRequestToStatusRequest(
  req: ExperienceRequest,
): StatusRequest {
  const dateStr = req.confirmedDate ?? req.preferredDate;
  const timeStr = req.confirmedTime ?? req.preferredTime ?? '';

  const date = formatDateLabel(dateStr);
  const displayTime = timeStr
    ? format(
        parseISO(
          `2000-01-01T${timeStr.includes('T') ? timeStr.split('T')[1] : timeStr}`,
        ),
        'h:mm a',
      )
    : '';

  let meta = '';
  if (req.catalogItem?.durationLabel) {
    meta = req.catalogItem.durationLabel.toUpperCase();
  } else if (req.staffMemberName) {
    meta = req.staffMemberName.toUpperCase();
  } else if (req.status === 'PENDING') {
    meta = 'AWAITING CONFIRMATION';
  }

  const tabs = getTabsForStatus(req.status);
  const isToday_date = isToday(parseISO(dateStr));
  if (isToday_date && !tabs.includes('today')) {
    tabs.push('today');
  }

  return {
    id: req.id,
    title: req.catalogItem?.name ?? 'Experience',
    date,
    time: displayTime,
    meta,
    status: (STATUS_MAP[req.status] ??
      ExperienceStatus.PENDING) as import('@/components/Status/chipConfig').StatusRequestKey,
    tabs,
    showViewDetails: [
      'CONFIRMED',
      'IN_PROGRESS',
      'READY',
      'COMPLETED',
    ].includes(req.status),
  };
}

export function buildTimelineFromRequest(
  req: ExperienceRequest,
): RequestTimelineStep[] {
  const steps: Array<{ id: string; label: string; detail?: string }> = [
    {
      id: 'submitted',
      label: 'Submitted',
      detail: format(parseISO(req.createdAt), "MMM d '·' h:mm a").toUpperCase(),
    },
    {
      id: 'under-review',
      label: 'Under Review',
      detail: 'ESTATE MANAGER REVIEWING',
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      detail: req.confirmedDate
        ? `${format(parseISO(req.createdAt), "MMM d '·' h:mm a").toUpperCase()} · CONFIRMED FOR ${req.confirmedTime ?? ''}`
        : undefined,
    },
    { id: 'preparation-started', label: 'Preparation Started' },
    { id: 'ready', label: 'Ready', detail: "YOU'LL BE NOTIFIED" },
    { id: 'completed', label: 'Completed' },
  ];

  const statusOrder: RequestStatus[] = [
    'PENDING',
    'CONFIRMED',
    'IN_PROGRESS',
    'READY',
    'COMPLETED',
  ];

  const currentIdx = statusOrder.indexOf(req.status);

  const stepStatusMap: Record<string, number> = {
    submitted: 0,
    'under-review': 0,
    confirmed: 1,
    'preparation-started': 2,
    ready: 3,
    completed: 4,
  };

  return steps.map((step) => {
    const stepLevel = stepStatusMap[step.id] ?? 0;
    let state: 'completed' | 'active' | 'pending';
    if (stepLevel < currentIdx) {
      state = 'completed';
    } else if (stepLevel === currentIdx) {
      state = 'active';
    } else {
      state = 'pending';
    }
    return { ...step, state };
  });
}
