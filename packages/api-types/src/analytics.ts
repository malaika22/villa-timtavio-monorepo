export interface AnalyticsOverview {
  ytdRevenue: number;
  occupancyRate: number;
  experiencesBooked: number;
  avgSatisfaction: number;
}

export interface RevenueTrendPoint {
  month: number;
  revenue: number;
}

export interface RevenueTrend {
  year: number;
  data: RevenueTrendPoint[];
}

export interface OccupancyStats {
  occupancyRate: number;
  bookedNights: number;
  totalDays: number;
}

export interface HeatMapCell {
  space: string;
  timeBlock: string;
  activityScore: number;
}

export interface PeakHour {
  timeBlock: string;
  activityIndex: number;
}

export interface ExperiencePerformanceItem {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  basePrice?: number | null;
  primaryPhotoUrl?: string | null;
  _count: { experienceRequests: number };
  vendor?: { name: string; averageRating?: number | null } | null;
}

export interface UpcomingStay {
  id: string;
  guestInitials: string;
  /** Full guest name — the owner is entitled to know who is staying. */
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalGuests: number;
  status: string;
  estimatedRevenue: number;
}
