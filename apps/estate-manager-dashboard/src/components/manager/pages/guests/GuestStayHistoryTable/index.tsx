import { cn } from '@repo/ui/lib/utils';

import type { GuestDNAProfile } from '@/types';

export const GuestStayHistoryTable = ({
  profile,
}: {
  profile: GuestDNAProfile;
}) => (
  <section>
    <h3 className="mb-2 text-[10px] font-medium tracking-[0.14em] text-manager-text-muted uppercase">
      Stay History
    </h3>
    {profile.stayHistory.length === 0 ? (
      <p className="text-sm text-manager-text-muted">No prior stays on file.</p>
    ) : (
      <div className="overflow-hidden rounded-lg border border-[#e5e0d8] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ebe6df] bg-[#f7f5f2]">
              {['Visit', 'Villa', 'Duration', 'Outcome', 'Folio Total'].map(
                (h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-3 py-2 text-[10px] font-medium tracking-[0.12em] text-manager-text-muted uppercase',
                      i === 4 ? 'text-right' : 'text-left',
                    )}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {profile.stayHistory.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#ebe6df] last:border-0"
              >
                <td className="px-3 py-2.5">
                  <span className="font-medium text-manager-text">
                    {row.visit}
                  </span>
                  {row.isCurrent ? (
                    <span className="ml-1.5 text-sm text-manager-text-muted">
                      Current
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-manager-text">{row.villa}</td>
                <td className="px-3 py-2.5 text-manager-text-muted">
                  {row.duration}
                </td>
                <td className="px-3 py-2.5 text-manager-text-muted">
                  {row.outcome}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-manager-text">
                  {row.folioTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
