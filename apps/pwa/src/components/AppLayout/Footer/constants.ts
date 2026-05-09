import { ClockIcon, FileText, Home, LayoutDashboard } from 'lucide-react';

export const FOOTER_LINKS = [
  {
    label: 'Home',
    href: '/',
    Icon: Home,
  },
  {
    label: 'Explore',
    href: '/explore',
    Icon: LayoutDashboard,
  },
  {
    label: 'Folio',
    href: '/contact',
    Icon: FileText,
  },
  {
    label: 'Status',
    href: '/status',
    Icon: ClockIcon,
  },
];
