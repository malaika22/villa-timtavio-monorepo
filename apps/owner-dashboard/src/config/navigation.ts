import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Clock,
  DollarSign,
  Grid3x3,
  Heart,
  LineChart,
  Star,
  Users,
} from 'lucide-react';

export type IntelligenceNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const intelligenceNavigation: IntelligenceNavItem[] = [
  { title: 'Overview', href: '/', icon: Clock },
  { title: 'Heat Maps', href: '/heat-maps', icon: Grid3x3, badge: 'HERO' },
  { title: 'Analytics', href: '/analytics', icon: LineChart },
  { title: 'Experiences', href: '/experiences', icon: Star },
  { title: 'Vendors', href: '/vendors', icon: Users },
  { title: 'Capital Insights', href: '/capital-insights', icon: DollarSign },
  { title: 'Satisfaction', href: '/satisfaction', icon: Heart },
  { title: 'System Health', href: '/system-health', icon: Activity },
];

export type PageMeta = {
  title: string;
  subtitle: string;
};

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: 'Estate Overview',
    subtitle: 'Intelligence summary - March 2026',
  },
  '/heat-maps': {
    title: 'Service Heat Maps',
    subtitle: 'Real-time activity density across the estate',
  },
  '/analytics': {
    title: 'Analytics',
    subtitle: 'Revenue trends, occupancy & performance',
  },
  '/experiences': {
    title: 'Experience Intelligence',
    subtitle: 'Demand analysis & booking trends',
  },
  '/vendors': {
    title: 'Vendor Intelligence',
    subtitle: 'Performance analysis & ROI tracking',
  },
  '/capital-insights': {
    title: 'Capital Insights',
    subtitle: 'Buy vs. rent analysis & equipment decisions',
  },
  '/satisfaction': {
    title: 'Guest Satisfaction',
    subtitle: 'Scores, sentiment & themes from post-stay reviews',
  },
  '/system-health': {
    title: 'System Health',
    subtitle: 'Platform status, uptime & performance',
  },
};
