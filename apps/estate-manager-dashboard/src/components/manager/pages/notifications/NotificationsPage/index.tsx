'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Bell, Check, CheckCheck, Info } from 'lucide-react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui/lib/utils';
import type { SystemAlert } from '@repo/api-types';

import {
  useAllSystemAlerts,
  useDismissSystemAlert,
  useMarkAllAlertsRead,
} from '@/hooks/useSystem';

function alertHref(alert: SystemAlert): string | null {
  switch (alert.entityType) {
    case 'Inquiry':
      return '/inquiries';
    case 'ExperienceRequest':
      return '/approvals';
    case 'Booking':
    case 'ManifestGuest':
      return '/bookings';
    default:
      return null;
  }
}

const isSevere = (sev: string) => sev === 'warning' || sev === 'critical';

export const NotificationsPage = () => {
  const { data: alerts = [], isLoading } = useAllSystemAlerts();
  const dismiss = useDismissSystemAlert();
  const markAll = useMarkAllAlertsRead();
  const [category, setCategory] = useState('all');

  const categories = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.category).filter(Boolean))),
    [alerts],
  );
  const filtered =
    category === 'all' ? alerts : alerts.filter((a) => a.category === category);
  const unread = alerts.filter((a) => !a.isDismissed).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors',
                category === c
                  ? 'border-manager-accent bg-manager-accent text-white'
                  : 'border-[#e8e4de] bg-white text-manager-text-muted hover:bg-[#faf9f7]',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="gap-1.5"
        >
          <CheckCheck className="size-4" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-manager-border"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#ebe6df] bg-white py-16 text-center">
          <Bell className="size-7 text-manager-text-muted" />
          <p className="text-sm text-manager-text-muted">
            {category === 'all'
              ? "You're all caught up."
              : 'No notifications in this category.'}
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-[#ebe6df] bg-white">
          {filtered.map((alert) => {
            const Icon = isSevere(alert.severity) ? AlertTriangle : Info;
            const href = alertHref(alert);
            const row = (
              <div
                className={cn(
                  'flex items-start gap-3 px-4 py-3.5',
                  !alert.isDismissed && 'bg-[#faf7f2]',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 rounded-full p-1.5',
                    isSevere(alert.severity)
                      ? 'bg-[#f6e7e4] text-[#a6473d]'
                      : 'bg-[#eef2f6] text-[#4d6c84]',
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!alert.isDismissed && (
                      <span className="size-2 shrink-0 rounded-full bg-manager-accent" />
                    )}
                    <p className="truncate text-sm font-medium text-manager-text">
                      {alert.title}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-manager-text-muted">
                    {alert.message}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-manager-text-muted/70">
                    {alert.category} ·{' '}
                    {formatDistanceToNow(new Date(alert.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!alert.isDismissed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mark read"
                    className="shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      dismiss.mutate(alert.id);
                    }}
                  >
                    <Check className="size-4 text-manager-text-muted" />
                  </Button>
                )}
              </div>
            );
            return (
              <li
                key={alert.id}
                className="border-b border-[#f1ece4] last:border-0"
              >
                {href ? (
                  <Link
                    href={href}
                    onClick={() =>
                      !alert.isDismissed && dismiss.mutate(alert.id)
                    }
                    className="block hover:bg-[#faf9f7]"
                  >
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
