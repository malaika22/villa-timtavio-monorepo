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

export interface DashboardAlertBanner {
  message: string | null;
  pendingApprovals: number;
  pendingInquiries: number;
  conflictMessage: string | null;
  reviewHref: string;
  alerts: SystemAlert[];
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
