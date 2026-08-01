'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Users, Link2, Plug, Gauge } from 'lucide-react';

import { IntelCard } from '@/components/intelligence/ui/IntelCard';
import { systemApi } from '@/lib/api/system';

function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const LiveSystemKpis = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: systemApi.health,
    refetchInterval: 10 * 60 * 1000,
  });

  const connected = data?.services.filter((s) => s.connected).length ?? 0;
  const totalServices = data?.services.length ?? 0;

  const cards = [
    {
      icon: Activity,
      label: 'Uptime (90d)',
      value:
        data?.uptimePercent != null
          ? `${data.uptimePercent}%`
          : data
            ? fmtUptime(data.uptimeSeconds)
            : '—',
    },
    {
      icon: Gauge,
      label: 'Avg response',
      value: data?.avgResponseMs != null ? `${data.avgResponseMs} ms` : '—',
    },
    {
      icon: Users,
      // Counts signed-in GUESTS only, not staff — the table below says as much,
      // so the label has to agree or it reads as broken when staff are online.
      label: 'Guest sessions',
      value: data?.activeSessions ?? '—',
    },
    {
      icon: Link2,
      label: 'Magic links · 30d',
      value: data?.magicLinks30d ?? '—',
    },
    {
      icon: Plug,
      label: 'Integrations',
      value: data ? `${connected}/${totalServices}` : '—',
    },
  ];

  const history = data?.history ?? [];
  const incidents = data?.incidents ?? [];
  const HIST_COLOR: Record<string, string> = {
    operational: '#2f8f6b',
    degraded: '#c08a2d',
    outage: '#a64b4b',
    'no-data': '#e7e2da',
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <IntelCard key={c.label} className="p-4">
              <Icon className="size-4 text-intel-maroon" />
              <p className="mt-2 font-cormorant text-[28px] leading-none text-intel-text">
                {isLoading ? '…' : c.value}
              </p>
              <p className="mt-1 text-xs text-intel-text-muted">{c.label}</p>
            </IntelCard>
          );
        })}
      </div>

      {data ? (
        <IntelCard className="p-4">
          <h3 className="mb-2 text-sm font-medium text-intel-text">
            Integration status
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-intel-text">{s.name}</span>
                <span
                  className={
                    s.connected
                      ? 'inline-flex items-center gap-1.5 text-[#2f8f6b]'
                      : 'inline-flex items-center gap-1.5 text-[#9a9288]'
                  }
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: s.connected ? '#2f8f6b' : '#cfc8bd' }}
                  />
                  {s.connected ? 'Operational' : 'Not configured'}
                </span>
              </li>
            ))}
          </ul>
        </IntelCard>
      ) : null}

      {/* Real 90-day uptime history (accumulates from heartbeat samples) */}
      <IntelCard className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-intel-text">
            90-Day Uptime History
          </h3>
          <span className="text-xs text-intel-text-muted">
            {data?.sampleCount ?? 0} samples
          </span>
        </div>
        <div className="flex items-end gap-[2px]">
          {history.map((h) => (
            <div
              key={h.date}
              className="h-8 flex-1 rounded-[1px]"
              style={{ background: HIST_COLOR[h.status] }}
              title={`${h.date}: ${h.status}`}
            />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-intel-text-muted">
          History fills in as the heartbeat sampler runs (every 5 min). Grey =
          no samples yet.
        </p>
      </IntelCard>

      {/* Incidents derived from failed heartbeat runs */}
      <IntelCard className="p-4">
        <h3 className="mb-2 text-sm font-medium text-intel-text">
          Recent Incidents
        </h3>
        {incidents.length === 0 ? (
          <p className="py-4 text-center text-sm text-intel-text-muted">
            No incidents recorded — all heartbeats healthy.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1ece4]">
            {incidents.map((inc, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-intel-text">
                  Degraded database connectivity
                </span>
                <span className="text-intel-text-muted">
                  {new Date(inc.startedAt).toLocaleString()} · {inc.samples}{' '}
                  failed check{inc.samples === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </IntelCard>
    </div>
  );
};
