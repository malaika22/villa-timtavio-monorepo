import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BedDouble,
  BookMarked,
  Calendar,
  CheckSquare,
  Flame,
  Gauge,
  Inbox,
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
      {
        title: 'Approvals',
        href: '/approvals',
        icon: CheckSquare,
      },
      { title: 'Bookings + Manifest', href: '/bookings', icon: BookMarked },
      { title: 'Rooms', href: '/rooms', icon: BedDouble },
      { title: 'Guests', href: '/guests', icon: Users },
      { title: 'Inquiries', href: '/inquiries', icon: Inbox },
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

// ─── Owner navigation ───────────────────────────────────────────────────────

export const ownerNavSections: ManagerNavSection[] = [
  {
    label: 'Intelligence',
    items: [
      { title: 'Overview', href: '/overview', icon: Gauge },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
      { title: 'Heat Maps', href: '/heat-maps', icon: Flame },
      { title: 'System Health', href: '/system-health', icon: Activity },
    ],
  },
];

/** Returns the nav sections appropriate for the signed-in role(s). */
export function getNavSections(opts: {
  isOwner?: boolean;
  isEM?: boolean;
}): ManagerNavSection[] {
  const sections: ManagerNavSection[] = [];
  if (opts.isOwner) sections.push(...ownerNavSections);
  if (opts.isEM) sections.push(...managerNavSections);
  // Fallback: if role unknown, show manager sections.
  return sections.length > 0 ? sections : managerNavSections;
}

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
    subtitle: '',
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
  '/rooms': {
    title: 'Rooms',
    subtitle: 'Room details, beds & amenities shown to guests',
    showNotifications: true,
  },
  '/guests': {
    title: 'Guest DNA',
    subtitle: 'Preferences, history & notes',
    showAddGuest: true,
    showNotifications: true,
    fullBleed: true,
  },
  '/inquiries': {
    title: 'Inquiries',
    subtitle: 'Review and action new property inquiries',
    showNotifications: true,
  },
  '/inquiries/[id]': {
    title: 'Inquiry Detail',
    subtitle: 'Review inquiry and make a decision',
    showNotifications: false,
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
  '/overview': {
    title: 'Owner Overview',
    subtitle: 'Estate performance at a glance',
    showNotifications: true,
  },
  '/analytics': {
    title: 'Analytics',
    subtitle: 'Revenue, occupancy & experience performance',
    showNotifications: true,
  },
  '/heat-maps': {
    title: 'Estate Heat Maps',
    subtitle: 'Where and when the estate is most active',
    showNotifications: true,
  },
  '/system-health': {
    title: 'System Health',
    subtitle: 'Integrations & background services',
    showNotifications: true,
  },
};
