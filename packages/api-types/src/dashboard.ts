import type { SystemAlert } from './system';

export interface DashboardKpis {
  guestsInHouse: number;
  arrivingToday: number;
  activeExperiences: number;
  afternoonExperiences: number;
  pendingApprovals: number;
  revenueToday: number;
  revenueVsLastWeek: number;
}

export interface DashboardReminder {
  type: 'check-in' | 'check-out';
  message: string;
  count: number;
  href: string;
}

export interface DashboardAlertBanner {
  message: string | null;
  pendingApprovals: number;
  pendingInquiries: number;
  conflictMessage: string | null;
  reviewHref: string;
  alerts: SystemAlert[];
  reminders: DashboardReminder[];
}

export interface DashboardScheduleItem {
  id: string;
  time: string;
  title: string;
  guestName: string | null;
  location: string | null;
  status: string;
  type: string;
  requestId: string | null;
  hasConflict: boolean;
}

export interface DashboardExport {
  filename: string;
  csv: string;
}

export type CalendarEventType =
  | 'arrival'
  | 'departure'
  | 'occupancy'
  | 'experience';

export interface WeekCalendarEvent {
  id: string;
  type: CalendarEventType;
  label: string;
  time?: string;
}

export interface WeekCalendarDay {
  date: string;
  events: WeekCalendarEvent[];
}

export interface WeekCalendar {
  weekStart: string;
  days: WeekCalendarDay[];
}
