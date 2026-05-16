import type { CalendarTimelineEvent, CalendarWeekDay } from '@/types';

export const calendarWeekLabel = 'March 23 – 29, 2026';

export const calendarWeekDays: CalendarWeekDay[] = [
  { key: 'mon-23', weekday: 'MON', dateLabel: 'Mar 23' },
  { key: 'tue-24', weekday: 'TUE', dateLabel: 'Mar 24' },
  { key: 'wed-25', weekday: 'WED', dateLabel: 'Mar 25' },
  { key: 'thu-26', weekday: 'THU', dateLabel: 'Mar 26' },
  { key: 'fri-27', weekday: 'FRI', dateLabel: 'Mar 27' },
  { key: 'sat-28', weekday: 'SAT', dateLabel: 'Mar 28' },
  { key: 'sun-29', weekday: 'SUN', dateLabel: 'Mar 29' },
];

export const calendarVillas = ['Villa 1', 'Villa 2', 'Villa 3', 'Villa 4', 'Villa 5', 'Villa 6'] as const;

export const calendarTimelineEvents: CalendarTimelineEvent[] = [
  { id: 'v1-occ', villa: 1, startDay: 2, span: 2, label: 'A. Khalil (occ.)', type: 'occupancy' },
  { id: 'v1-surf', villa: 1, startDay: 4, span: 1, label: 'Surf Lesson 9am', type: 'experience' },
  { id: 'v1-yacht', villa: 1, startDay: 5, span: 1, label: 'Yacht 5:30pm', type: 'experience' },
  { id: 'v2-occ', villa: 2, startDay: 3, span: 2, label: 'N. Weston (occ.)', type: 'occupancy' },
  { id: 'v2-wine', villa: 2, startDay: 4, span: 1, label: 'Wine Vault 8pm', type: 'experience' },
  { id: 'v2-spa', villa: 2, startDay: 6, span: 1, label: 'Spa Ritual 7:30pm', type: 'experience' },
  { id: 'v3-occ', villa: 3, startDay: 1, span: 2, label: 'J. Makarov (occ.)', type: 'occupancy' },
  { id: 'v3-pool', villa: 3, startDay: 2, span: 1, label: 'Pool Exclusive', type: 'experience', lane: 1 },
  { id: 'v3-chef', villa: 3, startDay: 4, span: 1, label: "Chef's Table", type: 'experience' },
  { id: 'v4-occ', villa: 4, startDay: 0, span: 2, label: 'S. Patel (occ.)', type: 'occupancy' },
  { id: 'v4-surf', villa: 4, startDay: 3, span: 1, label: 'Surf Lesson 9am', type: 'experience' },
  { id: 'v4-out', villa: 4, startDay: 4, span: 1, label: 'Checkout 11am', type: 'departure' },
  { id: 'v5-arr', villa: 5, startDay: 4, span: 3, label: 'L. Rodriguez', type: 'arrival' },
  { id: 'v6-arr', villa: 6, startDay: 4, span: 3, label: 'L. Rodriguez', type: 'arrival' },
];

export const calendarLegendItems = [
  { type: 'occupancy' as const, label: 'Occupancy' },
  { type: 'experience' as const, label: 'Experience' },
  { type: 'arrival' as const, label: 'Arrival' },
  { type: 'departure' as const, label: 'Departure' },
];
