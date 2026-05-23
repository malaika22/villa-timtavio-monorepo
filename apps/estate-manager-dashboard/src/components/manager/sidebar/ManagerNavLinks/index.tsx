'use client';

import Link from 'next/link';
import { cn } from '@repo/ui/lib/utils';

import { managerNavSections } from '@/config/navigation';

type Props = {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
};

/** Shared sidebar / mobile nav links with section labels */
export const ManagerNavLinks = ({ pathname, onNavigate, className }: Props) => (
  <div className={cn('space-y-6', className)}>
    {managerNavSections.map((section) => (
      <div key={section.label}>
        <p className="mb-3 px-3 text-[10px] font-medium tracking-[0.14em] text-manager-nav-section uppercase">
          {section.label}
        </p>
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors',
                    isActive
                      ? 'bg-manager-sidebar-active text-white'
                      : 'text-manager-nav-muted hover:bg-white/[0.04] hover:text-white/80',
                  )}
                >
                  {isActive ? (
                    <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#c4a882]" />
                  ) : null}
                  <Icon className="size-[17px] shrink-0" strokeWidth={1.5} />
                  <span className="flex-1">{item.title}</span>
                  {item.countBadge != null ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#c45c3e] text-[10px] font-semibold text-white">
                      {item.countBadge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </div>
);
