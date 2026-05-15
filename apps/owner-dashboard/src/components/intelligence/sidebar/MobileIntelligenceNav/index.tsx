'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Sheet, SheetContent, SheetTrigger } from '@repo/ui';
import { Menu } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

import { intelligenceNavigation } from '@/config/navigation';

export const MobileIntelligenceNav = () => {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 border-intel-border lg:hidden"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[260px] border-0 bg-intel-sidebar p-0 text-white"
      >
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-cormorant text-xl">Casa TimTavio</p>
          <p className="mt-1 text-[9px] tracking-[0.2em] text-white/40 uppercase">
            Intelligence
          </p>
        </div>
        <nav className="p-3">
          {intelligenceNavigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'mb-0.5 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm',
                  isActive
                    ? 'bg-intel-sidebar-active text-white'
                    : 'text-intel-nav-muted',
                )}
              >
                <Icon className="size-4" />
                {item.title}
                {item.badge ? (
                  <span className="ml-auto text-[8px] text-[#d4a5a5] uppercase">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
