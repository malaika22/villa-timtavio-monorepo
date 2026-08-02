import type { EmExperienceRequest, RequestStatus } from '@repo/api-types';
import type { ApprovalQueueItem, ApprovalQueueStatus } from '@/types';
import { format, parseISO } from 'date-fns';

const STATUS_MAP: Record<RequestStatus, ApprovalQueueStatus> = {
  PENDING: 'Pending',
  CONFLICT: 'Conflict',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  READY: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Declined',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function mapRequestToApprovalItem(
  req: EmExperienceRequest,
): ApprovalQueueItem {
  const dateStr = req.confirmedDate ?? req.preferredDate;
  const timeStr = req.confirmedTime ?? req.preferredTime ?? '';

  let displayTime = timeStr;
  try {
    displayTime = format(
      parseISO(
        `2000-01-01T${timeStr.includes('T') ? timeStr.split('T')[1]! : timeStr}`,
      ),
      'h:mm a',
    );
  } catch {
    displayTime = timeStr;
  }

  const displayDate = (() => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  })();

  const submittedAt = (() => {
    try {
      return format(parseISO(req.createdAt), 'MMM d · h:mm a');
    } catch {
      return req.createdAt;
    }
  })();

  const booking = req.booking ?? null;
  const primary = booking?.primaryGuest;
  const stayLabel = primary
    ? `${primary.firstName} ${primary.lastName}`.trim() || primary.email
    : 'Unassigned stay';

  // "Aug 3 – Aug 16, 2026" — the year once, at the end, since a stay almost
  // never straddles one.
  const stayDates = (() => {
    if (!booking?.checkIn || !booking.checkOut) return '';
    try {
      const from = parseISO(booking.checkIn);
      const to = parseISO(booking.checkOut);
      return `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
    } catch {
      return '';
    }
  })();

  return {
    id: req.id,
    bookingId: req.bookingId,
    stayLabel,
    stayDates,
    stayCheckIn: booking?.checkIn ?? null,
    experienceDate: dateStr ?? null,
    guestName: req.requestedByName,
    initials: initials(req.requestedByName),
    partyLabel: `${req.guestCount} guest${req.guestCount === 1 ? '' : 's'}`,
    experience: req.catalogItem?.name ?? 'Experience',
    experienceDetail: displayDate,
    villa: 'Villa TimTavio',
    requestedDate: displayDate,
    requestedTime: displayTime,
    vendor: req.staffMemberName ?? '—',
    submitted: submittedAt,
    status: STATUS_MAP[req.status] ?? 'Pending',
    declineReason: req.declineReason ?? null,
    conflictReason: req.conflictReason ?? null,
    estimatedMin: req.estimatedMin ?? null,
    estimatedMax: req.estimatedMax ?? null,
    priceUnitCode: req.priceUnitCode ?? null,
    confirmedCost: req.confirmedCost ?? null,
  };
}
