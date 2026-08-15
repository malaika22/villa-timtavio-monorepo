'use client';

import { AlertTriangle, Info, AlertOctagon, Check } from 'lucide-react';

import {
  useSystemAlerts,
  useDismissSystemAlert,
  useClearSystemAlerts,
} from '@/hooks/useSystem';

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
  const clearAll = useClearSystemAlerts();

  return (
    <section className="rounded-xl border border-manager-border bg-manager-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-cormorant text-[20px] text-manager-text">
          System Alerts
        </h2>
        {alerts.length > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-manager-text-muted">
              {alerts.length} active
            </span>
            {/* Nothing else empties this. Ticking a dozen notices one at a time
                is a chore nobody does, so without it the panel only grows. */}
            <button
              type="button"
              onClick={() => clearAll.mutate()}
              disabled={clearAll.isPending}
              className="text-xs font-medium text-manager-text-muted underline underline-offset-2 hover:text-manager-text disabled:opacity-50"
            >
              {clearAll.isPending ? 'Clearing…' : 'Clear all'}
            </button>
          </div>
        ) : null}
      </div>

      {alerts.length === 0 ? (
        <p className="py-6 text-center text-sm text-manager-text-muted">
          No active alerts.
        </p>
      ) : (
        /* Bounded and scrolled inside the card. Unbounded, the panel grew a row
           per alert and pushed the whole dashboard down — the busier the estate
           got, the further everything else moved. `tabIndex` so the region can
           be scrolled from the keyboard, which an overflow container otherwise
           can't be. */
        <ul
          tabIndex={0}
          aria-label="System alerts"
          className="max-h-[22rem] space-y-2 overflow-y-auto pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-manager-accent"
        >
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
                    <p className="text-xs text-manager-text-muted">
                      {a.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss.mutate(a.id)}
                  aria-label={`Dismiss: ${a.title}`}
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
