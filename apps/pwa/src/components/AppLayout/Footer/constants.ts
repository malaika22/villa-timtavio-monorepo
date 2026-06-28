import { ClockIcon, FileText, Home, LayoutDashboard } from 'lucide-react';

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

export function getFooterLinks(isSecondary: boolean): FooterLink[] {
  return [HOME, EXPLORE, isSecondary ? MY_ORDERS : FOLIO, STATUS];
}

export const FOOTER_LINKS = getFooterLinks(false);
