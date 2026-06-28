'use client';

import Link from 'next/link';
import { Bell, Check, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@repo/ui';
import type { SystemAlert } from '@repo/api-types';

import { useSystemAlerts, useDismissSystemAlert } from '@/hooks/useSystem';

const outlineIconBtn =
  'relative size-9 rounded-md border border-[#e8e4de] bg-white shadow-none hover:bg-[#faf9f7]';

function alertIcon(alert: SystemAlert) {
  if (alert.category === 'REMINDER' && alert.entityType === 'check-in') {
    return <LogIn className="size-4 text-[#b45309]" strokeWidth={2} />;
  }
  if (alert.category === 'REMINDER' && alert.entityType === 'check-out') {
    return <LogOut className="size-4 text-[#1e429f]" strokeWidth={2} />;
  }
  return <AlertTriangle className="size-4 text-[#b45309]" strokeWidth={2} />;
}

function alertHref(alert: SystemAlert): string | null {
  if (alert.category === 'REMINDER') return '/';
  if (alert.category === 'BOOKING') return '/approvals';
  return null;
}

export const NotificationBell = () => {
  const { data: alerts = [] } = useSystemAlerts();
  const dismiss = useDismissSystemAlert();

  const count = alerts.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={outlineIconBtn}
          aria-label={`Notifications${count ? ` (${count} unread)` : ''}`}
        >
          <Bell className="size-4 text-manager-text-muted" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-manager-accent px-1 text-[10px] font-semibold leading-[18px] text-white">
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[340px] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-[#eee8e0] px-4 py-3">
          <p className="font-inter text-sm font-semibold text-manager-text">
            Notifications
          </p>
          {count > 0 ? (
            <span className="font-inter text-xs text-manager-text-muted">
              {count} unread
            </span>
          ) : null}
        </div>

        {count === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto size-6 text-[#cfc8bd]" strokeWidth={1.5} />
            <p className="font-inter mt-2 text-sm text-manager-text-muted">
              You&apos;re all caught up
            </p>
          </div>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-[#f1ece4] overflow-y-auto">
            {alerts.map((alert) => {
              const href = alertHref(alert);
              const body = (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fbf3df]">
                    {alertIcon(alert)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-inter text-sm font-medium leading-snug text-manager-text">
                      {alert.title}
                    </p>
                    <p className="font-inter mt-0.5 text-xs leading-snug text-manager-text-muted">
                      {alert.message}
                    </p>
                    <p className="font-inter mt-1 text-[11px] text-[#a8a29e]">
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dismiss.mutate(alert.id);
                    }}
                    aria-label="Dismiss"
                    className="shrink-0 rounded-md p-1 text-manager-text-muted transition-colors hover:bg-[#f5f0e8] hover:text-manager-text"
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              );

              return (
                <li key={alert.id} className="hover:bg-[#faf8f5]">
                  {href ? (
                    <Link href={href} className="block">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
