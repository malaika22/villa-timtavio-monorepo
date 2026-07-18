'use client';

import { useQuery } from '@tanstack/react-query';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { systemApi } from '@/lib/api/system';

const COLUMNS = ['User', 'Role', 'Session Start'] as const;

// Deterministic avatar colour from initials (no randomness).
const AVATAR_COLORS = ['#c4a882', '#8e8e8e', '#6b8e6b', '#7b6348', '#5e3a31'];
const colorFor = (initials: string) => {
  const code = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(diffMs / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const ActiveSessionsTable = () => {
  const { data } = useQuery({
    queryKey: ['system', 'active-sessions'],
    queryFn: systemApi.activeSessions,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  const rows = data ?? [];

  return (
    <section>
      <h3 className="mb-3 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]">
        Active Sessions Now
      </h3>
      <IntelCard padding={false} className="overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
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
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-8 text-center text-sm text-intel-text-muted"
                  >
                    No guests are currently signed in.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-intel-border last:border-0 ${i % 2 === 1 ? 'bg-[#faf9f7]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                          style={{ backgroundColor: colorFor(row.initials) }}
                        >
                          {row.initials}
                        </span>
                        <span className="text-intel-text">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-intel-text-muted">
                      {row.role}
                    </td>
                    <td className="px-4 py-3 text-intel-text-muted">
                      {relativeTime(row.sessionStartAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </IntelCard>
    </section>
  );
};
