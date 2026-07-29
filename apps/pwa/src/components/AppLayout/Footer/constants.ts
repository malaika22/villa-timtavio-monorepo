import {
  ClockIcon,
  FileText,
  Home,
  LayoutDashboard,
  Users,
} from 'lucide-react';

export type FooterLink = {
  label: string;
  href: string;
  Icon: typeof Home;
};

const HOME: FooterLink = { label: 'Home', href: '/', Icon: Home };
const EXPLORE: FooterLink = {
  label: 'Explore',
  href: '/experiences',
  Icon: LayoutDashboard,
};
const STATUS: FooterLink = { label: 'Status', href: '/status', Icon: ClockIcon };

// Primary members see the priced Folio; secondary guests see My Orders
// (their own requests, no pricing) in the same slot.
const FOLIO: FooterLink = { label: 'Folio', href: '/folio', Icon: FileText };
const MY_ORDERS: FooterLink = {
  label: 'Orders',
  href: '/my-orders',
  Icon: FileText,
};
// Primary-only hub: party overview + the approvals entry point.
const PARTY: FooterLink = { label: 'Party', href: '/party', Icon: Users };

export function getFooterLinks(isSecondary: boolean): FooterLink[] {
  // Secondary: Home · Explore · Orders · Status.
  // Primary: Home · Explore · Status · Party. Both tiers get a Status tab (the
  // entry point for tracking requests); the primary's priced Folio moves to a
  // card on Home. Party keeps approvals + the party overview.
  return isSecondary
    ? [HOME, EXPLORE, MY_ORDERS, STATUS]
    : [HOME, EXPLORE, STATUS, PARTY];
}

export const FOOTER_LINKS = getFooterLinks(false);
