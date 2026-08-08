import { vendorStage } from '@repo/api-types';
import type {
  BookingStatus,
  DashboardScheduleItem,
  EmExperienceRequest,
  GuestWithBookings,
} from '@repo/api-types';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

import type {
  ApprovalQueueItem,
  CurrentGuest,
  GuestStayStatus,
  PendingApproval,
  ScheduleItem,
} from '@/types';

const IN_HOUSE_STATUSES: BookingStatus[] = [
  'CHECKED_IN',
  'SETTLED',
  'DEPARTURE_TODAY',
];

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function mapBookingStatusToGuestStatus(
  status?: BookingStatus,
): GuestStayStatus {
  switch (status) {
    case 'DEPARTURE_TODAY':
      return 'Departing';
    case 'CONFIRMED':
      return 'Arriving';
    case 'CHECKED_OUT':
      return 'Departed';
    case 'CHECKED_IN':
      return 'Checked in';
    case 'SETTLED':
    default:
      return 'Settled';
  }
}

function formatCheckout(checkOut?: string): string {
  if (!checkOut) return '—';
  try {
    return format(parseISO(checkOut), 'MMM d');
  } catch {
    return checkOut;
  }
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '—';
  try {
    const raw = timeStr.includes('T') ? timeStr.split('T')[1]! : timeStr;
    return format(parseISO(`2000-01-01T${raw}`), 'HH:mm');
  } catch {
    return timeStr.slice(0, 5);
  }
}

function guestDisplayName(req: EmExperienceRequest): string {
  const guest = req.booking?.primaryGuest;
  if (guest) return `${guest.firstName} ${guest.lastName}`;
  return req.requestedByName;
}

export function countInHouseGuests(guests: GuestWithBookings[]): number {
  return guests.filter((g) => {
    const status = g.primaryBookings?.[0]?.status;
    return status && IN_HOUSE_STATUSES.includes(status);
  }).length;
}

function formatVilla(roomNumber?: number | null): string {
  return roomNumber != null ? `Villa ${roomNumber}` : 'Villa TimTavio';
}

export function mapGuestToCurrentGuest(guest: GuestWithBookings): CurrentGuest {
  const booking = guest.primaryBookings?.[0];
  return {
    id: guest.id,
    bookingId: booking?.id ?? '',
    name: `${guest.firstName} ${guest.lastName}`,
    initials: initials(guest.firstName, guest.lastName),
    partySize: booking?.totalGuests ?? 1,
    villa: formatVilla(booking?.primaryRoomNumber),
    checkout: formatCheckout(booking?.checkOut),
    status: mapBookingStatusToGuestStatus(booking?.status),
    bookingStatus: booking?.status ?? 'CONFIRMED',
  };
}

export function mapEmRequestToApprovalItem(
  req: EmExperienceRequest,
): ApprovalQueueItem {
  const guestName = guestDisplayName(req);
  const timeStr = req.confirmedTime ?? req.preferredTime ?? '';
  let displayTime = timeStr;
  try {
    const raw = timeStr.includes('T') ? timeStr.split('T')[1]! : timeStr;
    displayTime = format(parseISO(`2000-01-01T${raw}`), 'h:mm a');
  } catch {
    displayTime = timeStr;
  }

  const dateStr = req.confirmedDate ?? req.preferredDate;
  const displayDate = (() => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  })();

  const submittedAt = (() => {
    try {
      return formatDistanceToNow(parseISO(req.createdAt), { addSuffix: true });
    } catch {
      return req.createdAt;
    }
  })();

  const queueStatus: ApprovalQueueItem['status'] =
    req.status === 'CONFLICT' ? 'Conflict' : 'Pending';

  const primary = req.booking?.primaryGuest;

  return {
    id: req.id,
    bookingId: req.bookingId,
    stayLabel: primary
      ? `${primary.firstName} ${primary.lastName}`.trim() || primary.email
      : 'Unassigned stay',
    // The dashboard summary lists requests, never groups them — the stay's own
    // dates aren't fetched here and would only be dead weight.
    stayDates: '',
    stayCheckIn: req.booking?.checkIn ?? null,
    experienceDate: dateStr ?? null,
    guestName,
    initials: initialsFromName(guestName),
    partyLabel: `${req.guestCount} guest${req.guestCount === 1 ? '' : 's'}`,
    experience: req.catalogItem?.name ?? 'Experience',
    experienceDetail: displayDate,
    villa: formatVilla(req.booking?.primaryRoomNumber),
    requestedDate: displayDate,
    requestedTime: displayTime,
    vendor: req.catalogItem?.vendor?.name ?? req.staffMemberName ?? '—',
    submitted: submittedAt,
    status: queueStatus,
    vendorStage: vendorStage(req),
    vendorName: req.catalogItem?.vendor?.name ?? null,
    vendorAskedAt: req.vendorAskedAt ?? null,
  };
}

export function mapApprovalItemToPending(
  item: ApprovalQueueItem,
): PendingApproval {
  return {
    id: item.id,
    guestName: item.guestName,
    initials: item.initials,
    villa: item.villa,
    experience: item.experience,
    vendor: item.vendor,
    requestedTime: item.requestedTime,
    submitted: item.submitted,
    status: item.status === 'Conflict' ? 'Conflict' : 'Pending',
  };
}

export function mapDashboardScheduleItem(
  item: DashboardScheduleItem,
): ScheduleItem {
  const statusLabel =
    item.hasConflict || item.status === 'CONFLICT'
      ? 'CONFLICT'
      : item.status === 'CONFIRMED' || item.status === 'READY'
        ? 'CONFIRMED'
        : item.status === 'PENDING'
          ? 'Pending'
          : item.status.replace('_', ' ');

  let variant: ScheduleItem['variant'] = 'default';
  if (item.hasConflict || item.status === 'CONFLICT') variant = 'conflict';
  else if (item.status === 'CONFIRMED' || item.status === 'READY')
    variant = 'confirmed';
  else if (item.status === 'PENDING') variant = 'pending';

  const subtitle = [item.location, item.guestName, statusLabel]
    .filter(Boolean)
    .join(' · ');

  return {
    id: item.id,
    time: formatTime(item.time),
    title: item.title,
    detail: subtitle,
    variant,
  };
}

export function mapEmRequestToScheduleItem(
  req: EmExperienceRequest,
): ScheduleItem {
  const guestName = guestDisplayName(req);
  const location = req.catalogItem?.vendor?.name ?? 'Villa TimTavio';
  const statusLabel =
    req.status === 'CONFIRMED' || req.status === 'READY'
      ? 'CONFIRMED'
      : req.status === 'PENDING'
        ? 'Pending'
        : req.status.replace('_', ' ');

  let variant: ScheduleItem['variant'] = 'default';
  if (req.status === 'CONFLICT') variant = 'conflict';
  else if (req.status === 'CONFIRMED' || req.status === 'READY')
    variant = 'confirmed';
  else if (req.status === 'PENDING') variant = 'pending';

  return {
    id: req.id,
    time: formatTime(req.confirmedTime ?? req.preferredTime),
    title: req.catalogItem?.name ?? 'Experience',
    detail: `${location} · ${guestName}${statusLabel ? ` — ${statusLabel}` : ''}`,
    variant,
  };
}

export function formatRevenueCompact(total: number): string {
  if (total >= 1_000_000) {
    return `$${(total / 1_000_000).toFixed(1)}M`;
  }
  if (total >= 1_000) {
    return `$${(total / 1_000).toFixed(1)}k`;
  }
  return `$${total.toFixed(0)}`;
}

export function formatLodgifySyncLabel(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Lodgify not synced yet';
  const diffMs = Date.now() - new Date(lastSyncAt).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Lodgify synced · just now';
  if (mins < 60) return `Lodgify synced · ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Lodgify synced · ${hours} hr ago`;
  return `Lodgify synced · ${Math.floor(hours / 24)} days ago`;
}
