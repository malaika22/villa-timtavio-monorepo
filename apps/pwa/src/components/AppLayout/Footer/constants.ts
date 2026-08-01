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
  // Primary: Home · Explore · Status · Folio.
  //
  // Folio sits here rather than on Home deliberately. As a Home card it led
  // with a running total in large type, putting a price in front of the guest
  // before they had seen a single experience — which is the last thing an
  // estate selling experiences wants. As a nav item it stays one tap away
  // without ever showing an amount. Party moves to a card on Home, where the
  // approvals prompt already handles anything urgent.
  return isSecondary
    ? [HOME, EXPLORE, MY_ORDERS, STATUS]
    : [HOME, EXPLORE, STATUS, FOLIO];
}

export const FOOTER_LINKS = getFooterLinks(false);
