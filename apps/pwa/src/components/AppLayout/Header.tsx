'use client';

import { Button } from '@repo/ui';
import { BellIcon, Phone } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { NotificationsDrawer } from '@/components/Notifications';
import { NOTIFICATIONS_MOCK } from '@/components/Notifications/mockData';

export const Header = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = NOTIFICATIONS_MOCK.filter((n) => !n.read).length;

  return (
    <>
      <div className="min-h-[44px] flex items-center px-[14px] py-4 border-b border-[#E3E0DA] justify-between sticky top-0 bg-white z-10">
        <Image src="/images/dark-logo.svg" alt="Logo" width={100} height={100} />
        <div className="space-x-3">
          <Button
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded-full bg-timtavio-background border border-[#E3E0DA] w-[28px] h-[28px]"
            aria-label="Open notifications"
          >
            <BellIcon size={10} className="text-[#797168]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-3.5 rounded-full bg-[#1A1A18] text-[7px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button className="rounded-full bg-[#F5F3F0] border border-[#E3E0DA] w-[28px] h-[28px]">
            <Phone size={10} className="text-[#797168]" />
          </Button>
        </div>
      </div>

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
};
