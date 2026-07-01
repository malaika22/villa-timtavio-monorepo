import type {
  ActiveSession,
  BuyRentAnalysisItem,
  SystemIncident,
  SystemServiceRow,
  UptimeSegmentStatus,
  ExperienceInsight,
  ExperiencePerformanceRow,
  VendorRecommendation,
  VendorRoiRow,
  IntelligenceAlert,
  MetricCard,
  OccupancyMonth,
  RevenueMonth,
  UpcomingStay,
  VillaOccupancy,
} from '@/types';

export const overviewMetrics: MetricCard[] = [
  {
    id: 'ytd-revenue',
    label: 'YTD REVENUE',
    value: '$624k',
    trend: '↑ 22% vs same period 2025',
    trendDirection: 'up',
  },
  {
    id: 'estate-occupancy',
    label: 'ESTATE OCCUPANCY',
    value: '61%',
    trend: '↑ 8 pts vs March 2025',
    trendDirection: 'up',
  },
  {
    id: 'experiences',
    label: 'EXPERIENCES BOOKED',
    value: '139',
    trend: '↑ 31% vs 2025',
    trendDirection: 'up',
  },
  {
    id: 'satisfaction',
    label: 'AVG GUEST SATISFACTION',
    value: '4.94',
    subtext: '38 reviews • 5★ majority',
  },
];

export const villaOccupancy: VillaOccupancy[] = [
  { id: 'v1', name: 'Villa 1', occupancy: 71, status: 'Occupied' },
  { id: 'v2', name: 'Villa 2', occupancy: 58, status: 'Occupied' },
  { id: 'v3', name: 'Villa 3', occupancy: 84, status: 'Occupied' },
  { id: 'v4', name: 'Villa 4', occupancy: 34, status: 'Available' },
  { id: 'v5', name: 'Villa 5', occupancy: 29, status: 'Available' },
  { id: 'v6', name: 'Villa 6', occupancy: 67, status: 'Occupied' },
];

export const revenueTrendData: RevenueMonth[] = [
  { month: 'Jan', y2026: 45, y2025: 40 },
  { month: 'Feb', y2026: 52, y2025: 46 },
  { month: 'Mar', y2026: 58, y2025: 50 },
  { month: 'Apr', y2026: 62, y2025: 55 },
  { month: 'May', y2026: 72, y2025: 62 },
  { month: 'Jun', y2026: 88, y2025: 72 },
  { month: 'Jul', y2026: 118, y2025: 95 },
  { month: 'Aug', y2026: 138, y2025: 110 },
  { month: 'Sep', y2026: 105, y2025: 88 },
  { month: 'Oct', y2026: 78, y2025: 68 },
  { month: 'Nov', y2026: 52, y2025: 48 },
  { month: 'Dec', y2026: 64, y2025: 54 },
];

export const intelligenceAlerts: IntelligenceAlert[] = [
  {
    id: 'a1',
    variant: 'success',
    message:
      'Peak season booking pace is 34% ahead of 2025 at the same point. 6 of 8 peak weeks already >90% leased.',
  },
  {
    id: 'a2',
    variant: 'warning',
    message:
      'Villa 5 & 6 underperforming at 45% occupancy for the next 90 days vs 61% estate average — targeted offer recommended.',
  },
  {
    id: 'a3',
    variant: 'info',
    message:
      "Experience demand spike: Chef's Table requests up 58% WoW — consider inventory pre-stock for arrival weeks.",
  },
  {
    id: 'a4',
    variant: 'warning',
    message:
      'Spa capacity constrained — 4 requests turned away this week for Easter weekend.',
  },
  {
    id: 'a5',
    variant: 'success',
    message:
      'L. Rodriguez (Founder Pass) return booking confirmed for Sep 15–29 — renewal opportunity.',
  },
];

export const upcomingStays: UpcomingStay[] = [
  {
    id: 's1',
    guestName: 'L. Rodriguez',
    guestInitials: 'LR',
    guestMeta: 'Founder Pass • 4th visit',
    villas: 'Villa 5 & 6',
    arrival: 'Mar 27',
    departure: 'Apr 2',
    nights: 6,
    party: 8,
    source: 'Member',
    estRevenue: '$68k',
    status: 'arriving-today',
  },
  {
    id: 's2',
    guestName: 'B. Fontaine',
    guestInitials: 'BF',
    guestMeta: 'Platinum • 2nd visit',
    villas: 'Villa 3',
    arrival: 'Apr 4',
    departure: 'Apr 11',
    nights: 7,
    party: 4,
    source: 'Direct',
    estRevenue: '$42k',
    status: 'confirmed',
  },
  {
    id: 's3',
    guestName: 'M. Ashworth',
    guestInitials: 'MA',
    guestMeta: 'Guest • 1st visit',
    villas: 'Villa 1',
    arrival: 'Apr 14',
    departure: 'Apr 21',
    nights: 7,
    party: 2,
    source: 'Agent',
    estRevenue: '$31k',
    status: 'pending-review',
  },
  {
    id: 's4',
    guestName: 'Chen Family',
    guestInitials: 'CF',
    guestMeta: 'Founder Pass • 3rd visit',
    villas: 'Villa 2 & 4',
    arrival: 'Apr 22',
    departure: 'Apr 29',
    nights: 7,
    party: 6,
    source: 'Member',
    estRevenue: '$54k',
    status: 'confirmed',
  },
];

export const heatMapHotZones = [
  { id: 'pool', label: 'Infinity Pool', score: 94 },
  { id: 'spa', label: 'Spa & Wellness', score: 72 },
  { id: 'dining', label: 'Dining Terrace', score: 68 },
  { id: 'beach', label: 'Beach Access', score: 55 },
  { id: 'v3', label: 'Villa 3 (Makarov)', score: 48 },
  { id: 'v1', label: 'Villa 1 (Khalil)', score: 41 },
];

export const heatMapPeakHours = [
  { hour: '6am', index: 18, peak: false },
  { hour: '7am', index: 22, peak: false },
  { hour: '8am', index: 28, peak: false },
  { hour: '9am', index: 35, peak: false },
  { hour: '10am', index: 42, peak: false },
  { hour: '11am', index: 52, peak: false },
  { hour: '12pm', index: 68, peak: true },
  { hour: '1pm', index: 62, peak: false },
  { hour: '2pm', index: 58, peak: false },
  { hour: '3pm', index: 55, peak: false },
  { hour: '4pm', index: 60, peak: false },
  { hour: '5pm', index: 72, peak: true },
  { hour: '6pm', index: 88, peak: true },
  { hour: '7pm', index: 82, peak: true },
  { hour: '8pm', index: 75, peak: true },
  { hour: '9pm', index: 58, peak: false },
  { hour: '10pm', index: 38, peak: false },
  { hour: '11pm', index: 22, peak: false },
];

export const heatMapInsights = [
  {
    id: 'hm1',
    variant: 'warning' as const,
    message:
      'Pool capacity at 94% — consider concierge rotation coordination.',
  },
  {
    id: 'hm2',
    variant: 'success' as const,
    message:
      'Spa demand correlates with Villa 3 guest pattern (4th visit). Pre-stage for tomorrow.',
  },
];

export const topProperties = [
  { property: 'Villa TimTavio — Main', revenue: '$48,200', bookings: 24, occupancy: '78%' },
  { property: 'Guest Cottage', revenue: '$18,600', bookings: 12, occupancy: '71%' },
  { property: 'Garden Suite A', revenue: '$12,400', bookings: 18, occupancy: '65%' },
  { property: 'Garden Suite B', revenue: '$11,100', bookings: 15, occupancy: '58%' },
];

export const analyticsMetrics: MetricCard[] = [
  {
    id: 'q1-revenue',
    label: 'Q1 2026 REVENUE',
    value: '$168k',
    trend: '↑ 22% vs Q1 2025 ($138k)',
    trendDirection: 'up',
  },
  {
    id: 'revpav',
    label: 'REVPAV (PER AVAILABLE VILLA)',
    value: '$9.3k',
    trend: '↑ 18% vs Q1 2025',
    trendDirection: 'up',
  },
  {
    id: 'stay-duration',
    label: 'AVG STAY DURATION',
    value: '5.8 nights',
    trend: '↑ from 4.9 in 2025',
    trendDirection: 'up',
  },
  {
    id: 'repeat-rate',
    label: 'REPEAT GUEST RATE',
    value: '64%',
    trend: '↑ 9 pts vs 2025',
    trendDirection: 'up',
  },
];

export const analyticsRevenueByMonth: RevenueMonth[] = [
  { month: 'Jan', y2026: 20, y2025: 18 },
  { month: 'Feb', y2026: 22, y2025: 20 },
  { month: 'Mar', y2026: 24, y2025: 22 },
  { month: 'Apr', y2026: 26, y2025: 24 },
  { month: 'May', y2026: 28, y2025: 26 },
  { month: 'Jun', y2026: 30, y2025: 28 },
  { month: 'Jul', y2026: 34, y2025: 30 },
  { month: 'Aug', y2026: 36, y2025: 32 },
  { month: 'Sep', y2026: 40, y2025: 34 },
  { month: 'Oct', y2026: 32, y2025: 28 },
  { month: 'Nov', y2026: 38, y2025: 32 },
  { month: 'Dec', y2026: 48, y2025: 40 },
];

/** Estate occupancy % — 12 months for area chart */
export const estateOccupancyByMonth: OccupancyMonth[] = [
  { month: 'Jan', y2026: 48, y2025: 42 },
  { month: 'Feb', y2026: 50, y2025: 44 },
  { month: 'Mar', y2026: 54, y2025: 48 },
  { month: 'Apr', y2026: 56, y2025: 50 },
  { month: 'May', y2026: 60, y2025: 54 },
  { month: 'Jun', y2026: 64, y2025: 58 },
  { month: 'Jul', y2026: 72, y2025: 64 },
  { month: 'Aug', y2026: 76, y2025: 68 },
  { month: 'Sep', y2026: 70, y2025: 62 },
  { month: 'Oct', y2026: 62, y2025: 56 },
  { month: 'Nov', y2026: 52, y2025: 46 },
  { month: 'Dec', y2026: 50, y2025: 44 },
];

export const experienceIntelligenceMetrics: MetricCard[] = [
  {
    id: 'exp-booked',
    label: 'TOTAL BOOKED YTD',
    value: '139',
    trend: '↑ 31% vs 2025 (106)',
    trendDirection: 'up',
  },
  {
    id: 'exp-revenue',
    label: 'REVENUE FROM EXPERIENCES',
    value: '$97k',
    subtext: '47% of total estate revenue',
  },
  {
    id: 'exp-avg',
    label: 'AVG PER EXPERIENCE',
    value: '$698',
    trend: '↑ 8% vs 2025',
    trendDirection: 'up',
  },
  {
    id: 'exp-decline',
    label: 'DECLINE / CONFLICT RATE',
    value: '6.2%',
    trend: '↑ 2 pts — capacity pressure',
    trendDirection: 'warning',
  },
];

export const experiencePerformanceRows: ExperiencePerformanceRow[] = [
  {
    id: 'chef',
    name: "Chef's Table",
    bookings: 34,
    revenue: '$34.0k',
    rating: 4.9,
    declined: 4,
    declinedPercent: 11,
    trend: '↑ 58%',
    trendDirection: 'up',
  },
  {
    id: 'pool',
    name: 'Pool Exclusive',
    bookings: 29,
    revenue: '$14.5k',
    rating: 5.0,
    declined: 0,
    declinedPercent: 0,
    trend: '↑ 24%',
    trendDirection: 'up',
  },
  {
    id: 'spa',
    name: 'Spa & Wellness',
    bookings: 26,
    revenue: '$20.8k',
    rating: 5.0,
    declined: 4,
    declinedPercent: 13,
    trend: '↑ 40%',
    trendDirection: 'up',
  },
  {
    id: 'yacht',
    name: 'Yacht Charter',
    bookings: 22,
    revenue: '$20.9k',
    rating: 4.9,
    declined: 0,
    declinedPercent: 0,
    trend: '↑ 29%',
    trendDirection: 'up',
  },
  {
    id: 'surf',
    name: 'Surf Lessons',
    bookings: 18,
    revenue: '$3.6k',
    rating: 4.7,
    declined: 1,
    declinedPercent: 6,
    trend: '→ 0%',
    trendDirection: 'neutral',
  },
  {
    id: 'wine',
    name: 'Wine Vault',
    bookings: 10,
    revenue: '$3.2k',
    rating: 5.0,
    declined: 0,
    declinedPercent: 0,
    trend: '↑ 67%',
    trendDirection: 'up',
  },
];

export const experienceDemandInsights: ExperienceInsight[] = [
  {
    id: 'ei1',
    variant: 'warning',
    title: "Chef's Table at capacity risk.",
    message:
      '11% decline rate signals vendor slot shortage. Adding a second culinary vendor could capture ~$12k in missed revenue per quarter.',
  },
  {
    id: 'ei2',
    variant: 'warning',
    title: 'Spa bottleneck growing.',
    message:
      'Single vendor (Tierra Spa) at 13% decline rate. Explore partnership with a second in-villa therapist for peak weeks.',
  },
  {
    id: 'ei3',
    variant: 'success',
    title: 'Wine Vault demand +67% YoY.',
    message:
      'Low cost, high margin. Consider premium vault membership tier for repeat guests.',
  },
  {
    id: 'ei4',
    variant: 'info',
    title: 'Peak demand window:',
    message:
      '3pm–8pm accounts for 74% of all experience requests. Consider staffing adjustments.',
  },
];

export const vendorIntelligenceMetrics: MetricCard[] = [
  {
    id: 'vendor-spend',
    label: 'TOTAL VENDOR SPEND YTD',
    value: '$38.2k',
    subtext: 'Across 5 active vendors',
  },
  {
    id: 'vendor-revenue',
    label: 'REVENUE GENERATED',
    value: '$97k',
    subtext: '2.5x ROI on vendor spend',
  },
  {
    id: 'vendor-rating',
    label: 'AVG VENDOR RATING',
    value: '4.92',
    trend: '↑ 0.08 vs 2025',
    trendDirection: 'up',
  },
  {
    id: 'vendor-declined',
    label: 'DECLINED REQUESTS',
    value: '9',
    trend: '6.2% rate — ↑ capacity pressure',
    trendDirection: 'warning',
  },
];

export const vendorRoiRows: VendorRoiRow[] = [
  {
    id: 'sommelier',
    name: 'Estate Sommelier',
    category: 'Wine & Spirits',
    bookings: 42,
    grossRevenue: '$28.4k',
    vendorCost: '$3.2k',
    netMargin: '$25.2k',
    roi: 8.0,
    roiLabel: '8.0x',
    rating: 4.9,
    declined: 0,
    declinedPercent: 0,
    status: 'Active',
  },
  {
    id: 'cocina',
    name: 'Cocina del Mar',
    category: 'Culinary',
    bookings: 34,
    grossRevenue: '$34.0k',
    vendorCost: '$9.7k',
    netMargin: '$24.3k',
    roi: 3.5,
    roiLabel: '3.5x',
    rating: 4.8,
    declined: 4,
    declinedPercent: 14,
    status: 'Active',
  },
  {
    id: 'tierra',
    name: 'Tierra Spa',
    category: 'Wellness',
    bookings: 26,
    grossRevenue: '$20.8k',
    vendorCost: '$6.5k',
    netMargin: '$14.3k',
    roi: 3.2,
    roiLabel: '3.2x',
    rating: 5.0,
    declined: 3,
    declinedPercent: 12,
    status: 'Active',
  },
  {
    id: 'atelier',
    name: 'Atelier Experiences',
    category: 'Experiences',
    bookings: 18,
    grossRevenue: '$12.4k',
    vendorCost: '$3.0k',
    netMargin: '$9.4k',
    roi: 4.1,
    roiLabel: '4.1x',
    rating: 4.9,
    declined: 0,
    declinedPercent: 0,
    status: 'Active',
  },
  {
    id: 'pacifico',
    name: 'Pacifico Yachts',
    category: 'Marine',
    bookings: 22,
    grossRevenue: '$20.9k',
    vendorCost: '$13.1k',
    netMargin: '$7.8k',
    roi: 1.6,
    roiLabel: '1.6x',
    rating: 4.7,
    declined: 2,
    declinedPercent: 9,
    status: 'Active',
  },
];

export const vendorStrategicRecommendations: VendorRecommendation[] = [
  {
    id: 'vr1',
    variant: 'success',
    title: 'Estate Sommelier',
    message:
      'delivers 8.0x ROI at lowest vendor cost. Expand private tasting slots for peak-season guests.',
  },
  {
    id: 'vr2',
    variant: 'warning',
    title: 'Cocina del Mar + Tierra Spa',
    message:
      'show 12–14% decline rates. Renegotiate capacity blocks or onboard backup vendors before Q3 peak.',
  },
  {
    id: 'vr3',
    variant: 'info',
    title: 'Pacifico Yachts',
    message:
      'ROI below estate target (1.6x). Review fuel surcharge pass-through and minimum charter pricing.',
  },
];

export const capitalInsightsMetrics: MetricCard[] = [
  {
    id: 'annual-spend',
    label: 'ANNUAL VENDOR SPEND',
    value: '$142k',
    subtext: 'Projected full-year 2026',
  },
  {
    id: 'own-asset-savings',
    label: 'POTENTIAL OWN-ASSET SAVINGS',
    value: '$38k',
    subtext: 'If 3 key assets were owned',
  },
  {
    id: 'payback-avg',
    label: 'PAYBACK PERIOD (AVG)',
    value: '2.4 yrs',
    subtext: 'Across recommended purchases',
  },
];

export const buyRentAnalysisItems: BuyRentAnalysisItem[] = [
  {
    id: 'spa',
    category: 'SPA EQUIPMENT SUITE',
    decision: 'BUY',
    description: 'Massage tables, hot stone sets, aromatherapy rigs',
    metrics: [
      { label: 'Current annual cost', value: '$14.2k' },
      { label: 'Purchase cost', value: '$11k' },
      { label: 'Payback period', value: '1.3 yrs' },
    ],
    recommendationLead: 'Recommend: Purchase.',
    recommendationBody:
      'At current utilization (26 bookings/qtr), owned equipment costs are fully recovered within 16 months vs. vendor lease.',
    variant: 'buy',
  },
  {
    id: 'yacht',
    category: 'YACHT / WATERCRAFT',
    decision: 'HOLD',
    description: '42ft charter vessel + tender for guest excursions',
    metrics: [
      { label: 'Current annual cost', value: '$13.1k' },
      { label: 'Purchase cost', value: '$180k' },
      { label: 'Payback period', value: '5.2 yrs' },
    ],
    recommendationLead: 'Hold decision.',
    recommendationBody:
      'Payback exceeds 5-year threshold at current booking volume (22/qtr). Revisit if bookings exceed 35/qtr.',
    variant: 'hold',
  },
  {
    id: 'surf',
    category: 'SURF EQUIPMENT',
    decision: 'BUY',
    description: 'Boards, wetsuits, safety gear for up to 8 guests',
    metrics: [
      { label: 'Current annual cost', value: '$2.1k' },
      { label: 'Purchase cost', value: '$4.8k' },
      { label: 'Payback period', value: '0.9 yrs' },
    ],
    recommendationLead: 'Recommend: Purchase.',
    recommendationBody:
      'Low upfront cost, high frequency of use (18 lessons/qtr). Eliminates per-session vendor markup entirely.',
    variant: 'buy',
  },
  {
    id: 'wine',
    category: 'WINE CELLAR EXPANSION',
    decision: 'BUY',
    description: 'Climate-controlled storage + tasting room upgrade',
    metrics: [
      { label: 'Current annual cost', value: '$3.2k' },
      { label: 'Investment cost', value: '$24k' },
      { label: 'Projected ROI', value: '8.0x' },
    ],
    recommendationLead: 'Recommend: Invest.',
    recommendationBody:
      'Wine Vault experience at 8x ROI and growing 67% YoY. Expansion supports premium membership tier.',
    variant: 'buy',
  },
  {
    id: 'chef',
    category: 'PRIVATE CHEF PARTNERSHIP',
    decision: 'RENT',
    description: 'Cocina del Mar vendor model vs. resident estate chef',
    metrics: [
      { label: 'Vendor annual cost', value: '$9.7k' },
      { label: 'Resident chef cost', value: '$56k' },
      { label: 'Revenue delta', value: '+$18k' },
    ],
    recommendationLead: 'Continue vendor model.',
    recommendationBody:
      'Resident chef adds $18k revenue potential but costs $56k more annually. Vendor flexibility preferred at current scale.',
    variant: 'rent',
  },
  {
    id: 'golf',
    category: 'GOLF CART / MOBILITY FLEET',
    decision: 'BUY',
    description: '4-cart fleet for villa-to-beach and estate transit',
    metrics: [
      { label: 'Rental annual cost', value: '$8.4k' },
      { label: 'Purchase cost', value: '$22k' },
      { label: 'Payback period', value: '2.1 yrs' },
    ],
    recommendationLead: 'Recommend: Purchase.',
    recommendationBody:
      'Operational necessity at full occupancy. Owned fleet reduces guest wait times and eliminates peak-season surcharges.',
    variant: 'buy',
  },
];

const uptimeSegments = (
  degraded: number[] = [],
  outage: number[] = [],
): UptimeSegmentStatus[] =>
  Array.from({ length: 90 }, (_, i) => {
    if (outage.includes(i)) return 'outage';
    if (degraded.includes(i)) return 'degraded';
    return 'operational';
  });

export const systemHealthMetrics: MetricCard[] = [
  {
    id: 'platform-uptime',
    label: 'PLATFORM UPTIME (90D)',
    value: '99.8%',
    subtext: '1 incident · 4h downtime',
  },
  {
    id: 'api-response',
    label: 'API RESPONSE (AVG)',
    value: '142ms',
    trend: '↓ 12ms vs last month',
    trendDirection: 'up',
  },
  {
    id: 'active-sessions',
    label: 'ACTIVE SESSIONS',
    value: '6',
    subtext: '3 guests · 2 staff · 1 owner',
  },
  {
    id: 'magic-links',
    label: 'MAGIC LINKS SENT (30D)',
    value: '24',
    subtext: '100% delivery rate',
  },
];

export const systemServiceRows: SystemServiceRow[] = [
  {
    id: 'guest-pwa',
    name: 'Guest PWA',
    icon: 'smartphone',
    status: 'Operational',
    uptime90d: '99.9%',
    lastChecked: 'Just now',
    segments: uptimeSegments([88]),
  },
  {
    id: 'estate-api',
    name: 'Estate Manager API',
    icon: 'server',
    status: 'Operational',
    uptime90d: '99.8%',
    lastChecked: 'Just now',
    segments: uptimeSegments([], [87]),
  },
  {
    id: 'auth',
    name: 'Auth / Magic Links',
    icon: 'lock',
    status: 'Operational',
    uptime90d: '100%',
    lastChecked: 'Just now',
    segments: uptimeSegments(),
  },
  {
    id: 'wifi',
    name: 'Estate WiFi Network',
    icon: 'wifi',
    status: 'Operational',
    uptime90d: '99.6%',
    lastChecked: '2 min ago',
    segments: uptimeSegments([85, 86], [87]),
  },
  {
    id: 'payments',
    name: 'Payment Processing',
    icon: 'zap',
    status: 'Operational',
    uptime90d: '99.9%',
    lastChecked: 'Just now',
    segments: uptimeSegments(),
  },
  {
    id: 'owner-dash',
    name: 'Owner Dashboard',
    icon: 'layout-dashboard',
    status: 'Operational',
    uptime90d: '99.8%',
    lastChecked: 'Just now',
    segments: uptimeSegments(),
    showInUptimeHistory: false,
  },
];

export const systemIncidents: SystemIncident[] = [
  {
    id: 'inc1',
    date: 'Mar 12, 2026',
    service: 'Guest PWA',
    description: 'Intermittent 502 errors on experience booking flow',
    duration: '4h 12m',
    rootCause: 'Upstream API timeout',
    resolution: 'Resolved',
  },
  {
    id: 'inc2',
    date: 'Feb 28, 2026',
    service: 'Estate WiFi Network',
    description: 'Villa 4 access point offline during storm',
    duration: '2h 05m',
    rootCause: 'Hardware failure',
    resolution: 'Resolved',
  },
  {
    id: 'inc3',
    date: 'Feb 14, 2026',
    service: 'Payment Processing',
    description: 'Card authorization delays for international guests',
    duration: '45m',
    rootCause: 'Gateway latency spike',
    resolution: 'Resolved',
  },
];

export const activeSessions: ActiveSession[] = [
  {
    id: 's1',
    name: 'J. Makarov',
    initials: 'JM',
    avatarColor: '#c4a882',
    role: 'Guest · Villa 3',
    device: 'iPhone 15 Pro',
    screen: 'My Folio',
    sessionStart: '14 min ago',
  },
  {
    id: 's2',
    name: 'A. Khalil',
    initials: 'AK',
    avatarColor: '#8e8e8e',
    role: 'Guest · Villa 1',
    device: 'iPad Pro',
    screen: 'Experiences',
    sessionStart: '22 min ago',
  },
  {
    id: 's3',
    name: 'N. Whitfield',
    initials: 'NW',
    avatarColor: '#7b6348',
    role: 'Guest · Villa 5',
    device: 'Samsung S24',
    screen: 'Estate Map',
    sessionStart: '8 min ago',
  },
  {
    id: 's4',
    name: 'Estate Concierge',
    initials: 'EC',
    avatarColor: '#4a6d55',
    role: 'Staff',
    device: 'iPad Mini',
    screen: 'Guest Requests',
    sessionStart: '1h ago',
  },
  {
    id: 's5',
    name: 'Housekeeping Lead',
    initials: 'HL',
    avatarColor: '#b5aca3',
    role: 'Staff',
    device: 'Android Tablet',
    screen: 'Room Status',
    sessionStart: '35 min ago',
  },
  {
    id: 's6',
    name: 'Tim (You)',
    initials: 'T',
    avatarColor: '#5e3a31',
    role: 'Owner',
    device: 'MacBook Pro',
    screen: 'System Health',
    sessionStart: 'Now',
    isYou: true,
  },
];
