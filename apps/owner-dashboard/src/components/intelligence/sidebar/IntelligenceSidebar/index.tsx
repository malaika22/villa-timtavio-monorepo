'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';

import { intelligenceNavigation } from '@/config/navigation';

export const IntelligenceSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden w-intel-sidebar shrink-0 flex-col bg-intel-sidebar text-white lg:flex">
      <div className="border-b border-white/[0.08] px-5 py-6">
        <p className="font-cormorant text-[26px] leading-none tracking-wide text-white">
          Villa TimTavio
        </p>
        <p className="mt-2 text-[9px] tracking-[0.22em] text-white/45 uppercase">
          Intelligence Dashboard
        </p>
        <span className="mt-3 inline-block rounded-full border border-white/10 bg-[#3d2a28] px-2.5 py-0.5 text-[9px] font-medium tracking-[0.1em] text-white/75 uppercase">
          Owner Access
        </span>
      </div>

      <nav className="flex-1 px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-medium tracking-[0.14em] text-intel-nav-section uppercase">
          Intelligence
        </p>
        <ul className="space-y-0.5">
          {intelligenceNavigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors',
                    isActive
                      ? 'bg-intel-sidebar-active text-white'
                      : 'text-intel-nav-muted hover:bg-white/[0.04] hover:text-white/80',
                  )}
                >
                  {isActive ? (
                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-intel-maroon" />
                  ) : null}
                  <Icon className="size-[17px] shrink-0" strokeWidth={1.5} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge ? (
                    <span className="rounded bg-[#3d2a28] px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-[#d4a5a5] uppercase">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.08] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-intel-maroon text-sm font-medium text-white">
            T
          </div>
          <div>
            <p className="text-sm font-medium text-white">Tim</p>
            <p className="text-[11px] text-intel-nav-muted">Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
