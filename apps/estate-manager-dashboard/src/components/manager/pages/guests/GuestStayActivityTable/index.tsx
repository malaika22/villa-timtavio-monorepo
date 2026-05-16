import { GuestStayActivityStatusPill } from '@/components/manager/pages/guests/GuestStayActivityStatus';
import type { GuestDNAProfile } from '@/types';

export const GuestStayActivityTable = ({ profile }: { profile: GuestDNAProfile }) => (
  <section>
    <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      Current Stay Activity
    </h3>
    {profile.stayActivity.length === 0 ? (
      <p className="text-sm text-manager-text-muted">No activity recorded.</p>
    ) : (
      <div className="overflow-hidden rounded-lg border border-[#e5e0d8] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ebe6df] bg-[#f7f5f2]">
              <th className="px-3 py-2 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Experience
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Date
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {profile.stayActivity.map((row) => (
              <tr key={row.id} className="border-b border-[#ebe6df] last:border-0">
                <td className="px-3 py-2 font-medium text-manager-text">{row.experience}</td>
                <td className="px-3 py-2 text-manager-text-muted">{row.date}</td>
                <td className="px-3 py-2">
                  <GuestStayActivityStatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
