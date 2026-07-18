'use client';

import { usePathname } from 'next/navigation';

import { ManagerNavLinks } from '@/components/manager/sidebar/ManagerNavLinks';
import { useDashboardAuth } from '@/hooks/use-dashboard-auth';
import { getInitials } from './helpers';

export const ManagerSidebar = () => {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useDashboardAuth();

  const displayName = user?.name ?? '';
  const initials = displayName ? getInitials(displayName) : '—';
  const roleLabel =
    user?.isOwner && user?.isEM
      ? 'Owner · Estate Manager'
      : user?.isOwner
        ? 'Owner'
        : 'Estate Manager';

  return (
    <aside className="sticky top-0 hidden h-screen w-manager-sidebar shrink-0 flex-col bg-manager-sidebar text-white lg:flex">
      <div className="border-b border-white/[0.08] px-5 py-6">
        <p className="font-cormorant text-[26px] leading-none tracking-wide text-white">
          Casa TimTavio
        </p>
        <p className="mt-2 text-[9px] tracking-[0.22em] text-white/45 uppercase">
          Estate Manager
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ManagerNavLinks pathname={pathname} />
      </nav>

      <div className="border-t border-white/[0.08] px-4 py-4">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="size-9 animate-pulse rounded-full bg-white/20" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 animate-pulse rounded bg-white/20" />
              <div className="h-2.5 w-14 animate-pulse rounded bg-white/15" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-manager-accent text-sm font-medium text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {displayName || 'Manager'}
                </p>
                <p className="text-[11px] text-manager-nav-muted">
                  {roleLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 text-[11px] text-manager-nav-muted transition-colors hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
