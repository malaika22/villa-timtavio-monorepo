import { ApprovalFilterTab, ApprovalQueueItem } from '@/types';

export function filterBySearch(
  items: ApprovalQueueItem[],
  query: string,
): ApprovalQueueItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.guestName.toLowerCase().includes(q) ||
      i.experience.toLowerCase().includes(q) ||
      i.villa.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q),
  );
}

export function filterByTab(
  items: ApprovalQueueItem[],
  tab: ApprovalFilterTab,
): ApprovalQueueItem[] {
  switch (tab) {
    case 'pending':
      return items.filter((i) => i.status === 'Pending');
    case 'confirmed':
      return items.filter((i) => i.status === 'Confirmed');
    case 'in-progress':
      return items.filter((i) => i.status === 'In Progress');
    case 'completed':
      return items.filter((i) => i.status === 'Completed');
    case 'declined':
      return items.filter((i) => i.status === 'Declined');
    default:
      return items;
  }
}
