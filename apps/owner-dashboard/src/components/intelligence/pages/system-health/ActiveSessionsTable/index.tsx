import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { activeSessions } from '@/lib/mock-data';

const COLUMNS = ['User', 'Role', 'Device', 'Screen', 'Session Start'] as const;

/** Figma 268:2508 — Active Sessions Now */
export const ActiveSessionsTable = () => (
  <section>
    <h3 className="mb-3 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Active Sessions Now
    </h3>
    <IntelCard padding={false} className="overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-intel-border bg-[#f7f5f2]">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeSessions.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-intel-border last:border-0 ${i % 2 === 1 ? 'bg-[#faf9f7]' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                      style={{ backgroundColor: row.avatarColor }}
                    >
                      {row.initials}
                    </span>
                    <span
                      className={
                        row.isYou ? 'font-semibold text-intel-text' : 'text-intel-text'
                      }
                    >
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-intel-text-muted">{row.role}</td>
                <td className="px-4 py-3 text-intel-text-muted">{row.device}</td>
                <td className="px-4 py-3 text-intel-text-muted">{row.screen}</td>
                <td className="px-4 py-3 text-intel-text-muted">{row.sessionStart}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IntelCard>
  </section>
);
