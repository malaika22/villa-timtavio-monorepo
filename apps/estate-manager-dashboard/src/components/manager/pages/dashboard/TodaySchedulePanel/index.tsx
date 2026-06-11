import { DashboardCard } from '@repo/dashboard-ui';
import { cn } from '@repo/ui/lib/utils';

import { SectionLinkHeader } from '@/components/manager/ui/SectionLinkHeader';
import { SectionEmptyState } from '@/components/manager/ui/SectionEmptyState';
import type { ScheduleItem } from '@/types';
import { defaultDot } from './constants';

export const TodaySchedulePanel = ({ items }: { items: ScheduleItem[] }) => (
  <div>
    <SectionLinkHeader
      title="Today's Schedule"
      href="/calendar"
      linkLabel="Full calendar →"
    />
    {items.length === 0 ? (
      <SectionEmptyState
        message="Nothing scheduled today"
        description="Experience requests and bookings for today will show on this timeline."
      />
    ) : (
      <DashboardCard variant="manager" padding={false} className="rounded-xl">
        <ul className="divide-y divide-manager-border">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-3.5">
              <span className="w-11 shrink-0 pt-0.5 text-sm tabular-nums text-manager-text-muted">
                {item.time}
              </span>
              <span
                className={cn(
                  'mt-1 size-2 shrink-0 rounded-full',
                  item.dotClass ?? defaultDot[item.variant],
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-manager-text">
                  {item.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-manager-text-muted">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </DashboardCard>
    )}
  </div>
);
