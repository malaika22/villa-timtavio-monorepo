import type { DashboardMetricCard } from '@repo/dashboard-ui';

import type {
  CalendarEvent,
  CurrentGuest,
  ManagerGuest,
  ManagerVendor,
  PendingApproval,
  ScheduleItem,
} from '@/types';

export const dashboardMetrics: DashboardMetricCard[] = [
  {
    id: 'in-house',
    label: 'GUESTS IN-HOUSE',
    value: '12',
    trend: '↑ 4 arriving today',
    trendDirection: 'up',
  },
  {
    id: 'experiences',
    label: 'ACTIVE EXPERIENCES',
    value: '4',
    subtext: '2 scheduled this afternoon',
  },
  {
    id: 'approvals',
    label: 'PENDING APPROVALS',
    value: '3',
    trend: 'Requires attention',
    trendDirection: 'warning',
  },
  {
    id: 'revenue',
    label: 'REVENUE TODAY',
    value: '$24.8k',
    trend: '↑ 12% vs last week',
    trendDirection: 'up',
  },
];

export const operationsAlertMessage =
  "3 approvals require attention — Chef's Table (Villa 3) conflicts with existing booking on Mar 27.";

export const currentGuests: CurrentGuest[] = [
  {
    id: 'cg1',
    bookingId: 'b1',
    name: 'A. Khalil',
    initials: 'AK',
    partySize: 4,
    villa: 'Villa 1',
    checkout: 'Mar 29',
    status: 'Settled',
    bookingStatus: 'SETTLED',
  },
  {
    id: 'cg2',
    bookingId: 'b2',
    name: 'S. Okafor',
    initials: 'SO',
    partySize: 2,
    villa: 'Villa 4',
    checkout: 'Mar 27',
    status: 'Departing',
    bookingStatus: 'DEPARTURE_TODAY',
  },
  {
    id: 'cg3',
    bookingId: 'b3',
    name: 'R. Lindqvist',
    initials: 'RL',
    partySize: 3,
    villa: 'Villa 6',
    checkout: 'Mar 30',
    status: 'Settled',
    bookingStatus: 'SETTLED',
  },
  {
    id: 'cg4',
    bookingId: 'b4',
    name: 'Martinez Family',
    initials: 'MF',
    partySize: 6,
    villa: 'Villa 4',
    checkout: 'Mar 28',
    status: 'Arriving',
    bookingStatus: 'CONFIRMED',
  },
];

export const todaySchedule: ScheduleItem[] = [
  {
    id: 's1',
    time: '09:00',
    title: 'Private Surf Lesson',
    detail: 'Villa 1 • A. Khalil - Beach South',
    variant: 'default',
    dotClass: 'bg-[#4a7c59]',
  },
  {
    id: 's2',
    time: '12:00',
    title: 'In-Villa Spa (Sofia L.)',
    detail: 'Villa 6 • R. Lindqvist',
    variant: 'default',
    dotClass: 'bg-[#7c5cbf]',
  },
  {
    id: 's3',
    time: '14:00',
    title: 'Helicopter Tour',
    detail: 'Villa 1 • A. Khalil — CONFIRMED',
    variant: 'confirmed',
    dotClass: 'bg-[#4a7c59]',
  },
  {
    id: 's4',
    time: '16:00',
    title: "Chef's Table — Pending",
    detail: 'Villa 3 • CONFLICT: see Approvals',
    variant: 'conflict',
    dotClass: 'bg-[#c53030]',
  },
  {
    id: 's5',
    time: '16:30',
    title: 'Guest Transport',
    detail: 'Estate Gate • Martinez Family',
    variant: 'default',
    dotClass: 'bg-[#1e429f]',
  },
  {
    id: 's6',
    time: '18:00',
    title: 'Sunset Yacht Dinner',
    detail: 'Villa 4 • Martinez Family — PENDING',
    variant: 'pending',
    dotClass: 'bg-[#d4a373]',
  },
  {
    id: 's7',
    time: '19:30',
    title: 'Estate Security Briefing',
    detail: 'Main Pavilion • On-duty team',
    variant: 'default',
    dotClass: 'bg-[#6b6560]',
  },
];

export const pendingApprovals: PendingApproval[] = [
  {
    id: 'pa1',
    guestName: 'A. Khalil',
    initials: 'AK',
    villa: 'Villa 1',
    experience: 'Private Surf Lesson',
    vendor: 'Surf Co.',
    requestedTime: 'Mar 27, 2:00 PM',
    submitted: '2h ago',
    status: 'Pending',
  },
  {
    id: 'pa2',
    guestName: 'J. Makarov',
    initials: 'JM',
    villa: 'Villa 3',
    experience: "Chef's Table — Oceanfront",
    vendor: 'Estate Culinary',
    requestedTime: 'Mar 27, 7:00 PM',
    submitted: '45m ago',
    status: 'Conflict',
  },
  {
    id: 'pa3',
    guestName: 'R. Lindqvist',
    initials: 'RL',
    villa: 'Villa 6',
    experience: 'Helicopter Tour',
    vendor: 'Sky Tours',
    requestedTime: 'Mar 28, 10:00 AM',
    submitted: '1h ago',
    status: 'Pending',
  },
];

export const allGuests: ManagerGuest[] = [
  ...currentGuests.map((g) => ({
    id: g.id,
    name: g.name,
    initials: g.initials,
    partySize: g.partySize,
    villa: g.villa,
    checkIn: 'Mar 24',
    checkout: g.checkout,
    status: g.status,
  })),
  {
    id: 'g5',
    name: 'S. Okafor',
    initials: 'SO',
    partySize: 2,
    villa: 'Villa 2',
    checkIn: 'Mar 22',
    checkout: 'Mar 27',
    status: 'Departing',
  },
];

export const managerVendors: ManagerVendor[] = [
  {
    id: 'v1',
    name: 'Azure Charters',
    service: 'Yacht & water experiences',
    contact: 'Marco V.',
    nextVisit: 'Mar 28, 6 PM',
    status: 'Scheduled',
  },
  {
    id: 'v2',
    name: 'Culinary Co.',
    service: 'Private chef & dining',
    contact: 'Elena S.',
    nextVisit: 'Mar 27, 7 PM',
    status: 'Active',
  },
  {
    id: 'v3',
    name: 'Serenity Spa',
    service: 'In-villa spa',
    contact: 'Ana R.',
    nextVisit: 'Mar 28, 9 AM',
    status: 'Scheduled',
  },
  {
    id: 'v4',
    name: 'GreenScape',
    service: 'Grounds maintenance',
    contact: 'James K.',
    nextVisit: 'Mar 29, 8 AM',
    status: 'Active',
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'ce1',
    date: 'Mar 27',
    time: '09:00',
    title: 'Private Surf Lesson',
    villa: 'Villa 1',
    type: 'Experience',
  },
  {
    id: 'ce2',
    date: 'Mar 27',
    time: '16:00',
    title: "Chef's Table",
    villa: 'Villa 3',
    type: 'Experience',
  },
  {
    id: 'ce3',
    date: 'Mar 27',
    time: '16:30',
    title: 'Guest Transport',
    villa: 'Estate Gate',
    type: 'Guest',
  },
  {
    id: 'ce4',
    date: 'Mar 28',
    time: '09:00',
    title: 'Spa Morning',
    villa: 'Villa 4',
    type: 'Vendor',
  },
  {
    id: 'ce5',
    date: 'Mar 28',
    time: '18:00',
    title: 'Sunset Yacht Dinner',
    villa: 'Villa 4',
    type: 'Experience',
  },
];
