import { DashboardCard } from '@repo/dashboard-ui';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ExperienceStatusPill } from '@/components/manager/pages/bookings/ExperienceStatusPill';
import type { CurrentBooking } from '@/types';

const PREVIEW_LIMIT = 4;

export const RequestedExperiencesCard = ({
  booking,
}: {
  booking: CurrentBooking;
}) => {
  const total = booking.experiences.length;
  const visible = booking.experiences.slice(0, PREVIEW_LIMIT);
  const hiddenCount = total - visible.length;

  return (
  <DashboardCard variant="manager" padding={false} className="overflow-hidden">
    <div className="flex items-center justify-between border-b border-[#ebe6df] px-5 py-3.5">
      <h3 className="text-sm font-semibold text-manager-text">
        Requested Experiences
      </h3>
      {total > 0 && (
        <span className="text-xs font-medium text-manager-text-muted">
          {total}
        </span>
      )}
    </div>
    {booking.experiences.length === 0 ? (
      <p className="px-5 py-8 text-center text-sm text-manager-text-muted">
        No experiences requested for this stay yet.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ebe6df] bg-[#f7f5f2]">
              <th className="px-5 py-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Experience
              </th>
              <th className="px-5 py-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Date
              </th>
              <th className="px-5 py-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#ebe6df] last:border-0"
              >
                <td className="px-5 py-3 font-medium text-manager-text">
                  {row.name}
                </td>
                <td className="px-5 py-3 text-manager-text-muted">
                  {row.date}
                </td>
                <td className="px-5 py-3">
                  <ExperienceStatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {total > 0 && (
      <Link
        href="/approvals"
        className="flex items-center justify-center gap-1.5 border-t border-[#ebe6df] px-5 py-3 text-xs font-semibold tracking-[0.02em] text-manager-text transition-colors hover:bg-[#f7f5f2]"
      >
        {hiddenCount > 0
          ? `See all ${total} in Approvals`
          : 'View in Approvals'}
        <ArrowRight className="size-3.5" />
      </Link>
    )}
  </DashboardCard>
  );
};
