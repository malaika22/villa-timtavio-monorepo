import {
  Calendar,
  CheckSquare,
  Clock,
  Shield,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

export type NotificationCategory = 'experiences' | 'manifest' | 'estate';
export type NotificationTabId = 'all' | NotificationCategory;

export interface AppNotification {
  id: number;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export const NOTIFICATION_TABS: { id: NotificationTabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'manifest', label: 'Manifest' },
  { id: 'estate', label: 'Estate' },
];

export const NOTIFICATIONS_MOCK: AppNotification[] = [
  {
    id: 1,
    category: 'manifest',
    title: 'Guest manifest approved',
    body: 'Your guest list has been reviewed and confirmed by the estate team.',
    timestamp: 'Just now',
    read: false,
    Icon: CheckSquare,
    iconBg: 'bg-[#E2EDE2]',
    iconColor: 'text-[#3A5E48]',
  },
  {
    id: 2,
    category: 'experiences',
    title: "Chef's Table confirmed",
    body: 'Wednesday 14 May, 7:30 pm — Private terrace. 8 guests.',
    timestamp: '18 min ago',
    read: false,
    Icon: UtensilsCrossed,
    iconBg: 'bg-[#EDE4D8]',
    iconColor: 'text-[#7A5C3A]',
  },
  {
    id: 3,
    category: 'estate',
    title: 'Check-in tomorrow',
    body: 'Your arrival at Casa TimTavio is confirmed for 3:00 pm. Estate Manager will greet you.',
    timestamp: '1 hr ago',
    read: false,
    Icon: Calendar,
    iconBg: 'bg-[#EDE8DC]',
    iconColor: 'text-[#7A6A4A]',
  },
  {
    id: 4,
    category: 'experiences',
    title: 'Spa & Wellness request received',
    body: "Pending approval from the estate team. You'll be notified shortly.",
    timestamp: 'Yesterday · 4:12 PM',
    read: true,
    Icon: Shield,
    iconBg: 'bg-[#EDEBE6]',
    iconColor: 'text-[#B0AAA0]',
  },
  {
    id: 5,
    category: 'estate',
    title: 'Welcome to TimTavio',
    body: 'Your stay is confirmed. Explore experiences, check your folio, and add your guests.',
    timestamp: '3 days ago',
    read: true,
    Icon: Clock,
    iconBg: 'bg-[#EDEBE6]',
    iconColor: 'text-[#B0AAA0]',
  },
];
