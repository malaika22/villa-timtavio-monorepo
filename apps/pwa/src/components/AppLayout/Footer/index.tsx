'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FOOTER_LINKS } from './constants';
import { cn } from '@repo/ui/lib/utils';

export const Footer = () => {
  const pathname = usePathname();

  return (
    <footer
      className={cn(
        'sticky bottom-0 z-50 bg-white border-t border-gray-100',
        // Shadow
        'shadow-[0_-4px_20px_rgba(0,0,0,0.08)]',
        // Smooth animation when the footer becomes sticky or re-renders
        'transition-all duration-300 ease-in-out',
      )}
    >
      <div className="flex items-center justify-between py-3 max-w-[330px] mx-auto">
        {FOOTER_LINKS.map(({ href, Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              href={href}
              key={href}
              className="flex flex-col items-center justify-center gap-2 transition-all duration-300 ease-in-out"
            >
              <Icon
                size={18}
                className={cn(
                  'transition-all duration-300 ease-in-out',
                  isActive
                    ? 'text-black scale-105'
                    : 'text-[#CEC6B8] scale-100',
                )}
              />

              <span
                className={cn(
                  'text-xs uppercase transition-all duration-300 ease-in-out',
                  isActive ? 'text-black' : 'text-[#CEC6B8]',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
};
