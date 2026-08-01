'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@repo/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/sheet';

import { ManagerNavLinks } from '@/components/manager/sidebar/ManagerNavLinks';

export const MobileManagerNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-manager-border bg-manager-card lg:hidden"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] border-manager-border bg-manager-sidebar p-0 text-white"
      >
        <SheetHeader className="border-b border-white/10 px-5 py-6 text-left">
          <SheetTitle className="font-cormorant text-2xl font-normal text-white">
            Villa TimTavio
          </SheetTitle>
          <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase">
            Estate Manager
          </p>
        </SheetHeader>
        <nav className="overflow-y-auto px-3 py-4">
          <ManagerNavLinks
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
};
