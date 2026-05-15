export type TrendDirection = 'up' | 'down' | 'neutral' | 'warning';

export type MetricCard = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: TrendDirection;
  subtext?: string;
};

export type VillaOccupancy = {
  id: string;
  name: string;
  occupancy: number;
  status: 'Occupied' | 'Available';
};

export type IntelligenceAlert = {
  id: string;
  variant: 'success' | 'warning' | 'info' | 'peach';
  message: string;
};

export type StayStatus = 'arriving-today' | 'confirmed' | 'pending-review';

export type UpcomingStay = {
  id: string;
  guestName: string;
  guestInitials: string;
  guestMeta: string;
  villas: string;
  arrival: string;
  departure: string;
  nights: number;
  party: number;
  source: string;
  estRevenue: string;
  status: StayStatus;
};

export type RevenueMonth = {
  month: string;
  y2026: number;
  y2025: number;
};

export type OccupancyMonth = {
  month: string;
  y2026: number;
  y2025: number;
};

export type VillaRevenueRow = {
  id: string;
  label: string;
  amount: string;
  percent: number;
};

export type DemographicRow = {
  id: string;
  label: string;
  percent: number;
};

export type ExperienceDemandMonth = {
  month: string;
  chefsTable: number;
  poolExclusive: number;
  spaWellness: number;
  yachtCharter: number;
};

export type ExperiencePerformanceRow = {
  id: string;
  name: string;
  bookings: number;
  revenue: string;
  rating: number;
  declined: number;
  declinedPercent: number;
  trend: string;
  trendDirection: TrendDirection;
};

export type ExperienceInsight = {
  id: string;
  variant: 'warning' | 'success' | 'info';
  title: string;
  message: string;
};

export type VendorRoiRow = {
  id: string;
  name: string;
  category: string;
  bookings: number;
  grossRevenue: string;
  vendorCost: string;
  netMargin: string;
  roi: number;
  roiLabel: string;
  rating: number;
  declined: number;
  declinedPercent: number;
  status: 'Active' | 'Review';
};

export type VendorRoiBar = {
  id: string;
  label: string;
  roi: number;
  roiLabel: string;
  lowPerformance?: boolean;
};

export type VendorRecommendation = {
  id: string;
  variant: 'warning' | 'success' | 'info';
  title: string;
  message: string;
};

export type CapitalDecision = 'BUY' | 'HOLD' | 'RENT';

export type BuyRentMetric = {
  label: string;
  value: string;
};

export type BuyRentRecommendationVariant = 'buy' | 'hold' | 'rent';

export type BuyRentAnalysisItem = {
  id: string;
  category: string;
  decision: CapitalDecision;
  description: string;
  metrics: [BuyRentMetric, BuyRentMetric, BuyRentMetric];
  recommendationLead: string;
  recommendationBody: string;
  variant: BuyRentRecommendationVariant;
};

export type UptimeSegmentStatus = 'operational' | 'degraded' | 'outage';

export type SystemServiceIcon =
  | 'smartphone'
  | 'server'
  | 'lock'
  | 'wifi'
  | 'zap'
  | 'layout-dashboard';

export type SystemServiceRow = {
  id: string;
  name: string;
  icon: SystemServiceIcon;
  status: 'Operational' | 'Degraded' | 'Outage';
  uptime90d: string;
  lastChecked: string;
  segments: UptimeSegmentStatus[];
  /** Shown in 90-day sparkline column (Figma shows 5 services) */
  showInUptimeHistory?: boolean;
};

export type SystemIncident = {
  id: string;
  date: string;
  service: string;
  description: string;
  duration: string;
  rootCause: string;
  resolution: 'Resolved' | 'Investigating';
};

export type ActiveSession = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: string;
  device: string;
  screen: string;
  sessionStart: string;
  isYou?: boolean;
};
