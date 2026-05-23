import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { StatusPill } from '@/components/intelligence/pages/system-health/StatusPill';
import { systemIncidents } from '@/lib/mock-data';

const COLUMNS = ['Date', 'Service', 'Description', 'Duration', 'Root Cause', 'Resolution'] as const;

export const RecentIncidentsTable = () => (
  <section>
    <h3 className="mb-3 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
      Recent Incidents
    </h3>
    <IntelCard padding={false} className="overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
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
            {systemIncidents.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-intel-border last:border-0 ${i % 2 === 1 ? 'bg-[#faf9f7]' : ''}`}
              >
                <td className="px-4 py-3 text-intel-text-muted">{row.date}</td>
                <td className="px-4 py-3 font-medium text-intel-text">{row.service}</td>
                <td className="max-w-[240px] px-4 py-3 text-intel-text-muted">{row.description}</td>
                <td className="px-4 py-3 tabular-nums text-intel-text-muted">{row.duration}</td>
                <td className="px-4 py-3 text-intel-text-muted">{row.rootCause}</td>
                <td className="px-4 py-3">
                  <StatusPill label={row.resolution} variant="success" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IntelCard>
  </section>
);
