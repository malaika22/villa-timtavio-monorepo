import {
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  UtensilsCrossed,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GuestNotification } from '@repo/api-types';

export type NotificationCategory = 'experiences' | 'manifest' | 'estate';

export interface DisplayNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const META: Record<
  string,
  {
    category: NotificationCategory;
    Icon: LucideIcon;
    iconBg: string;
    iconColor: string;
  }
> = {
  EXPERIENCE_READY: {
    category: 'experiences',
    Icon: Clock,
    iconBg: 'bg-[#EDE4D8]',
    iconColor: 'text-[#7A5C3A]',
  },
  REQUEST_CONFIRMED: {
    category: 'experiences',
    Icon: UtensilsCrossed,
    iconBg: 'bg-[#EDE4D8]',
    iconColor: 'text-[#7A5C3A]',
  },
  REQUEST_CANCELLED: {
    category: 'experiences',
    Icon: XCircle,
    iconBg: 'bg-[#F3E4E4]',
    iconColor: 'text-[#9A3A30]',
  },
  MANIFEST_APPROVED: {
    category: 'manifest',
    Icon: CheckSquare,
    iconBg: 'bg-[#E2EDE2]',
    iconColor: 'text-[#3A5E48]',
  },
  MAGIC_LINK_SENT: {
    category: 'manifest',
    Icon: Calendar,
    iconBg: 'bg-[#EDE8DC]',
    iconColor: 'text-[#7A6A4A]',
  },
  CHARGE_ADDED: {
    category: 'estate',
    Icon: CreditCard,
    iconBg: 'bg-[#EDEBE6]',
    iconColor: 'text-[#7A6A4A]',
  },
};

const DEFAULT_META = {
  category: 'estate' as const,
  Icon: Calendar,
  iconBg: 'bg-[#EDEBE6]',
  iconColor: 'text-[#7A6A4A]',
};

export function mapNotification(n: GuestNotification): DisplayNotification {
  const meta = META[n.type] ?? DEFAULT_META;
  return {
    id: n.id,
    category: meta.category,
    title: n.title,
    body: n.body,
    timestamp: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
    read: n.status === 'READ',
    Icon: meta.Icon,
    iconBg: meta.iconBg,
    iconColor: meta.iconColor,
  };
}
