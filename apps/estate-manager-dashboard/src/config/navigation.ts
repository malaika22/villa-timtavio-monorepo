import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookMarked,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  LayoutGrid,
  Truck,
  Users,
} from 'lucide-react';

export type ManagerNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Red count badge (e.g. Approvals) */
  countBadge?: number;
};

export type ManagerNavSection = {
  label: string;
  items: ManagerNavItem[];
};

export const managerNavSections: ManagerNavSection[] = [
  {
    label: 'Operations',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Approvals', href: '/approvals', icon: CheckSquare, countBadge: 3 },
      { title: 'Bookings + Manifest', href: '/bookings', icon: BookMarked },
      { title: 'Guests', href: '/guests', icon: Users },
      { title: 'Vendors', href: '/vendors', icon: Truck },
      { title: 'Calendar', href: '/calendar', icon: Calendar },
      { title: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Content',
    items: [{ title: 'Content Catalog', href: '/content', icon: LayoutGrid }],
  },
];

export const managerNavigation: ManagerNavItem[] = managerNavSections.flatMap(
  (section) => section.items,
);

export type PageMeta = {
  title: string;
  subtitle: string;
  showExport?: boolean;
  exportLabel?: string;
  showNotifications?: boolean;
  showAddGuest?: boolean;
  showAddVendor?: boolean;
  showFilterButton?: boolean;
  showPreviewGuestView?: boolean;
  showAddContentItem?: boolean;
  /** Bookings: Lodgify sync line in header */
  lodgifySync?: string;
  /** Guests DNA: edge-to-edge list + detail, no main padding */
  fullBleed?: boolean;
};

export const pageMeta: Record<string, PageMeta> = {
  '/': {
    title: 'Operations Overview',
    subtitle: 'Friday, March 27, 2026',
    showExport: true,
    showNotifications: true,
  },
  '/approvals': {
    title: 'Approvals Queue',
    subtitle: 'Experience requests & conflict resolution',
    showExport: true,
    showNotifications: true,
  },
  '/bookings': {
    title: 'Bookings + Manifest',
    subtitle: 'Current stay, upcoming arrivals & guest manifest review',
    showNotifications: true,
    lodgifySync: 'Lodgify synced · 4 min ago',
  },
  '/guests': {
    title: 'Guest DNA',
    subtitle: 'Preferences, history & notes',
    showAddGuest: true,
    showNotifications: true,
    fullBleed: true,
  },
  '/vendors': {
    title: 'Vendors',
    subtitle: 'Provider management & booking history',
    showAddVendor: true,
    showFilterButton: true,
    showNotifications: true,
  },
  '/calendar': {
    title: 'Calendar',
    subtitle: 'Bookings & experiences timeline',
    showExport: true,
    showNotifications: true,
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Revenue, occupancy & performance analytics',
    showExport: true,
    exportLabel: 'Export Report',
    showNotifications: true,
  },
  '/content': {
    title: 'Content Catalog',
    subtitle: 'Experiences, menus & recommendations shown to guests',
    showPreviewGuestView: true,
    showAddContentItem: true,
    showNotifications: true,
  },
};
