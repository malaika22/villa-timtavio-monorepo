import {
  LayoutDashboard,
  Lock,
  Server,
  Smartphone,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { StatusPill } from '@/components/intelligence/pages/system-health/StatusPill';
import { UptimeSegmentBar } from '@/components/intelligence/pages/system-health/UptimeSegmentBar';
import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { systemServiceRows } from '@/lib/mock-data';
import type { SystemServiceIcon } from '@/types';

const cellBorder = 'border-r border-intel-border last:border-r-0';

const SERVICE_ICONS: Record<SystemServiceIcon, LucideIcon> = {
  smartphone: Smartphone,
  server: Server,
  lock: Lock,
  wifi: Wifi,
  zap: Zap,
  'layout-dashboard': LayoutDashboard,
};

const sectionTitleClass =
  'shrink-0 font-cormorant text-[22px] leading-tight font-normal text-[#7b4343]';

const cardsRowClass =
  'grid min-w-0 grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] items-stretch gap-5';

const uptimePercentClass = (value: string) => {
  const n = parseFloat(value);
  if (n >= 99.8) return 'text-intel-success';
  if (n >= 99.5) return 'text-[#c4845c]';
  return 'text-[#a64b4b]';
};

const uptimeHistoryRows = systemServiceRows.filter((r) => r.showInUptimeHistory !== false);

/**
 * Figma 268:2508 — one header row; left + right cards in the same row below.
 * https://www.figma.com/design/TRYhkxSpS5vqNfpgk4PGqy/Casa-TimTavio---Responsive-Website-2.0?node-id=268-2508
 */
export const ServiceStatusUptimeSection = () => (
  <section className="min-w-0 space-y-3">
    {/* Figma header — one row: title | status + history | legend */}
    <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 pb-1">
      <h3 className={sectionTitleClass}>Service Status</h3>

      <div className="flex min-w-0 items-center justify-center gap-8 sm:gap-10">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-intel-success">
          <span className="size-2 shrink-0 rounded-full bg-intel-success" />
          All systems operational
        </span>
        <h3 className={sectionTitleClass}>90-Day Uptime History</h3>
      </div>

      <p className="shrink-0 whitespace-nowrap text-right text-[10px] leading-none tracking-tight text-intel-text-muted/90">
        Per service · Green = up · Yellow = degraded · Red = down
      </p>
    </div>

    {/* Left + right cards — always side by side (same row) */}
    <div className={cardsRowClass}>
      <IntelCard padding={false} className="min-w-0 overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-intel-border bg-[#f7f5f2]">
                {['Service', 'Status', 'Uptime (90d)', 'Last Checked'].map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-intel-text-muted uppercase ${cellBorder}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systemServiceRows.map((row, i) => {
                const Icon = SERVICE_ICONS[row.icon];
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-intel-border last:border-0 ${i % 2 === 1 ? 'bg-[#faf9f7]' : ''}`}
                  >
                    <td className={`px-4 py-3 ${cellBorder}`}>
                      <div className="flex items-center gap-2.5 font-medium text-intel-text">
                        <Icon
                          className="size-4 shrink-0 text-intel-text-muted"
                          strokeWidth={1.75}
                        />
                        {row.name}
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${cellBorder}`}>
                      <StatusPill
                        label={row.status}
                        variant={row.status === 'Operational' ? 'success' : 'warning'}
                      />
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold tabular-nums text-intel-text ${cellBorder}`}
                    >
                      {row.uptime90d}
                    </td>
                    <td className="px-4 py-3 text-sm text-intel-text-muted">{row.lastChecked}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </IntelCard>

      <IntelCard padding={false} className="flex min-w-0 flex-col rounded-xl">
        <div className="flex flex-1 flex-col justify-center gap-5 p-5">
          {uptimeHistoryRows.map((row) => (
            <div key={row.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm text-intel-text">{row.name}</span>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${uptimePercentClass(row.uptime90d)}`}
                >
                  {row.uptime90d}
                </span>
              </div>
              <UptimeSegmentBar segments={row.segments} />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-intel-border px-5 py-4">
          <div className="flex flex-wrap gap-4 text-[10px] text-intel-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#4a6d55]" />
              Operational
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#d4a373]" />
              Degraded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-[#a64b4b]" />
              Outage
            </span>
          </div>
          <p className="shrink-0 text-[10px] text-intel-text-muted">90 days · Each segment = 1 day</p>
        </div>
      </IntelCard>
    </div>
  </section>
);
