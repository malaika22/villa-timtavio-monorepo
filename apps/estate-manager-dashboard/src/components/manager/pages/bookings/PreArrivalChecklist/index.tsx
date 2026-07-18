import { DashboardCard } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';

import type { ChecklistItemStatus, CurrentBooking } from '@/types';

const dotClass: Record<ChecklistItemStatus, string> = {
  completed: 'bg-[#1e7e34]',
  pending: 'bg-[#b45309]',
  upcoming: 'bg-[#c4bdb5]',
};

export const PreArrivalChecklist = ({
  booking,
}: {
  booking: CurrentBooking;
}) => (
  <DashboardCard variant="manager" className="p-5">
    <h3 className="mb-4 text-sm font-semibold text-manager-text">
      Pre-Arrival Checklist
    </h3>
    <ul className="space-y-4">
      {booking.checklist.map((item) => (
        <li key={item.id} className="flex gap-3">
          <span
            className={cn(
              'mt-1.5 size-2.5 shrink-0 rounded-full',
              dotClass[item.status],
            )}
            aria-hidden
          />
          <div>
            <p
              className={cn(
                'text-sm font-medium',
                item.status === 'upcoming'
                  ? 'text-manager-text-muted'
                  : 'text-manager-text',
              )}
            >
              {item.title}
            </p>
            {item.detail ? (
              <p className="mt-0.5 text-sm text-manager-text-muted">
                {item.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  </DashboardCard>
);
