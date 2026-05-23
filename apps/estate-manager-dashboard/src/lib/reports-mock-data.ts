import type { DashboardMetricCard } from '@repo/dashboard-ui';

export const reportsSummaryMetrics: DashboardMetricCard[] = [
  {
    id: 'ytd-revenue',
    label: 'YTD REVENUE',
    value: '$168k',
    trend: '↑ 22% vs 2025',
    trendDirection: 'up',
  },
  {
    id: 'avg-occupancy',
    label: 'AVG OCCUPANCY',
    value: '74%',
    trend: '↑ 8pts vs 2025',
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
    label: 'GUEST SATISFACTION',
    value: '4.94',
    subtext: 'Based on 38 reviews',
  },
];

export type ReportsRevenueMonth = {
  month: string;
  valueK: number;
  label: string;
  highlight?: boolean;
};

export const reportsRevenue2026: ReportsRevenueMonth[] = [
  { month: 'Jan', valueK: 14.2, label: '$14.2k' },
  { month: 'Feb', valueK: 19.6, label: '$19.6k' },
  { month: 'Mar', valueK: 24.8, label: '$24.8k', highlight: true },
  { month: 'Apr', valueK: 18.4, label: '$18.4k' },
  { month: 'May', valueK: 16.1, label: '$16.1k' },
  { month: 'Jun', valueK: 21.3, label: '$21.3k' },
  { month: 'Jul', valueK: 22.7, label: '$22.7k' },
  { month: 'Aug', valueK: 20.5, label: '$20.5k' },
  { month: 'Sep', valueK: 17.9, label: '$17.9k' },
  { month: 'Oct', valueK: 15.4, label: '$15.4k' },
  { month: 'Nov', valueK: 13.8, label: '$13.8k' },
  { month: 'Dec', valueK: 12.6, label: '$12.6k' },
];

export const reportsRevenue2025: ReportsRevenueMonth[] = [
  { month: 'Jan', valueK: 11.8, label: '$11.8k' },
  { month: 'Feb', valueK: 15.2, label: '$15.2k' },
  { month: 'Mar', valueK: 18.4, label: '$18.4k', highlight: true },
  { month: 'Apr', valueK: 14.1, label: '$14.1k' },
  { month: 'May', valueK: 12.9, label: '$12.9k' },
  { month: 'Jun', valueK: 16.8, label: '$16.8k' },
  { month: 'Jul', valueK: 17.2, label: '$17.2k' },
  { month: 'Aug', valueK: 16.4, label: '$16.4k' },
  { month: 'Sep', valueK: 14.6, label: '$14.6k' },
  { month: 'Oct', valueK: 12.2, label: '$12.2k' },
  { month: 'Nov', valueK: 11.1, label: '$11.1k' },
  { month: 'Dec', valueK: 10.4, label: '$10.4k' },
];

export type ReportsProgressRow = {
  id: string;
  label: string;
  percent: number;
  detail: string;
};

export const reportsExperiencePopularity: ReportsProgressRow[] = [
  { id: 'chef', label: "Chef's Table", percent: 88, detail: '34 bookings · 24%' },
  { id: 'pool', label: 'Pool Exclusive', percent: 72, detail: '28 bookings · 20%' },
  { id: 'wine', label: 'Wine Vault', percent: 65, detail: '25 bookings · 18%' },
  { id: 'spa', label: 'Spa Ritual', percent: 58, detail: '22 bookings · 16%' },
  { id: 'yacht', label: 'Yacht Charter', percent: 48, detail: '18 bookings · 13%' },
  { id: 'surf', label: 'Surf Lesson', percent: 38, detail: '12 bookings · 9%' },
];

export const reportsVillaOccupancy: ReportsProgressRow[] = [
  { id: 'v1', label: 'Villa 1', percent: 71, detail: '22 / 31 nights · 71%' },
  { id: 'v2', label: 'Villa 2', percent: 84, detail: '26 / 31 nights · 84%' },
  { id: 'v3', label: 'Villa 3', percent: 77, detail: '24 / 31 nights · 77%' },
  { id: 'v4', label: 'Villa 4', percent: 68, detail: '21 / 31 nights · 68%' },
  { id: 'v5', label: 'Villa 5', percent: 90, detail: '28 / 31 nights · 90%' },
  { id: 'v6', label: 'Villa 6', percent: 74, detail: '23 / 31 nights · 74%' },
];

export const reportsEstateOccupancyAverage = '81%';

export type ReportsTopVendorRow = {
  id: string;
  vendor: string;
  category: string;
  bookings: number;
  revenue: string;
  rating: number;
  lastBooking: string;
};

export const reportsTopVendors: ReportsTopVendorRow[] = [
  {
    id: 'tv1',
    vendor: 'Cocina del Mar',
    category: 'Culinary',
    bookings: 28,
    revenue: '$38,200',
    rating: 4.9,
    lastBooking: 'Mar 27',
  },
  {
    id: 'tv2',
    vendor: 'Tierra Spa',
    category: 'Wellness',
    bookings: 34,
    revenue: '$24,600',
    rating: 4.8,
    lastBooking: 'Mar 26',
  },
  {
    id: 'tv3',
    vendor: 'Pacifico Yachts',
    category: 'Marine',
    bookings: 12,
    revenue: '$52,400',
    rating: 4.9,
    lastBooking: 'Mar 25',
  },
  {
    id: 'tv4',
    vendor: 'Punta Surf School',
    category: 'Water Sports',
    bookings: 19,
    revenue: '$8,400',
    rating: 4.7,
    lastBooking: 'Mar 24',
  },
  {
    id: 'tv5',
    vendor: 'Estate Sommelier',
    category: 'Culinary',
    bookings: 22,
    revenue: '$18,900',
    rating: 5.0,
    lastBooking: 'Mar 23',
  },
];
