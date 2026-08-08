'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getFooterLinks } from './constants';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@repo/ui/lib/utils';

export const Footer = () => {
  const pathname = usePathname();
  const { isSecondary } = useAuth();
  const links = getFooterLinks(isSecondary);

  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 bg-white border-t border-gray-100',
        // Shadow
        'shadow-[0_-4px_20px_rgba(0,0,0,0.08)]',
      )}
    >
      <div className="flex items-center justify-between py-3 max-w-[330px] mx-auto">
        {links.map(({ href, Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              href={href}
              key={href}
              // data-pressable opts the link into the app-wide press state; a
              // tab is the most-tapped control in the app and was the only one
              // that didn't answer a finger.
              data-pressable
              className="flex flex-col items-center justify-center gap-2"
            >
              <Icon
                size={18}
                className={cn(
                  'transition-[color,transform] duration-fast ease-out-estate',
                  isActive
                    ? 'text-black scale-105'
                    : 'text-[#CEC6B8] scale-100',
                )}
              />

              <span
                className={cn(
                  'text-xs uppercase transition-colors duration-fast ease-out-estate',
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
