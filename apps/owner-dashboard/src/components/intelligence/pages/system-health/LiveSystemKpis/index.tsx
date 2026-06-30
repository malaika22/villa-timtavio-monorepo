'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Users, Link2, Plug } from 'lucide-react';

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
    { icon: Activity, label: 'API uptime', value: data ? fmtUptime(data.uptimeSeconds) : '—' },
    { icon: Users, label: 'Active sessions', value: data?.activeSessions ?? '—' },
    { icon: Link2, label: 'Magic links · 30d', value: data?.magicLinks30d ?? '—' },
    { icon: Plug, label: 'Integrations', value: data ? `${connected}/${totalServices}` : '—' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
              <li key={s.key} className="flex items-center justify-between text-sm">
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
    </div>
  );
};
