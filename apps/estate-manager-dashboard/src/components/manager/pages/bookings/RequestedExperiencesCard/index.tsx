import { DashboardCard } from '@repo/dashboard-ui';

import { ExperienceStatusPill } from '@/components/manager/pages/bookings/ExperienceStatusPill';
import type { CurrentBooking } from '@/types';

export const RequestedExperiencesCard = ({ booking }: { booking: CurrentBooking }) => (
  <DashboardCard variant="manager" padding={false} className="overflow-hidden">
    <div className="border-b border-[#ebe6df] px-5 py-3.5">
      <h3 className="text-sm font-semibold text-manager-text">Requested Experiences</h3>
    </div>
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
          {booking.experiences.map((row) => (
            <tr key={row.id} className="border-b border-[#ebe6df] last:border-0">
              <td className="px-5 py-3 font-medium text-manager-text">{row.name}</td>
              <td className="px-5 py-3 text-manager-text-muted">{row.date}</td>
              <td className="px-5 py-3">
                <ExperienceStatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </DashboardCard>
);
