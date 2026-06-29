'use client';

import { AlertTriangle, Info, AlertOctagon, Check } from 'lucide-react';

import { useSystemAlerts, useDismissSystemAlert } from '@/hooks/useSystem';

function tone(severity: string) {
  const s = severity.toUpperCase();
  if (s.includes('URGENT') || s.includes('CRITICAL') || s.includes('ERROR'))
    return {
      icon: AlertOctagon,
      cls: 'text-[#b42318]',
      bg: 'bg-[#fef3f2]',
    };
  if (s.includes('WARN'))
    return {
      icon: AlertTriangle,
      cls: 'text-[#b45309]',
      bg: 'bg-[#fef6eb]',
    };
  return { icon: Info, cls: 'text-[#1e429f]', bg: 'bg-[#eff4ff]' };
}

export const SystemAlertsCard = () => {
  const { data: alerts = [] } = useSystemAlerts();
  const dismiss = useDismissSystemAlert();

  return (
    <section className="rounded-xl border border-manager-border bg-manager-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-cormorant text-[20px] text-manager-text">
          System Alerts
        </h2>
        {alerts.length > 0 ? (
          <span className="text-xs text-manager-text-muted">
            {alerts.length} active
          </span>
        ) : null}
      </div>

      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-manager-text-muted">
          No active alerts.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => {
            const t = tone(a.severity);
            const Icon = t.icon;
            return (
              <li
                key={a.id}
                className={`flex items-start gap-3 rounded-lg ${t.bg} px-3 py-2.5`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${t.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-manager-text">
                    {a.title}
                  </p>
                  {a.message ? (
                    <p className="text-xs text-manager-text-muted">{a.message}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss.mutate(a.id)}
                  aria-label="Dismiss"
                  className="shrink-0 rounded p-0.5 text-manager-text-muted hover:bg-white/60 hover:text-manager-text"
                >
                  <Check className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
