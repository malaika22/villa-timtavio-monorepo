'use client';

import { usePathname } from 'next/navigation';

import { ManagerNavLinks } from '@/components/manager/sidebar/ManagerNavLinks';

export const ManagerSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-manager-sidebar shrink-0 flex-col bg-manager-sidebar text-white lg:flex">
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
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-manager-accent text-sm font-medium text-white">
            MR
          </div>
          <div>
            <p className="text-sm font-medium text-white">Maria R.</p>
            <p className="text-[11px] text-manager-nav-muted">Estate Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
