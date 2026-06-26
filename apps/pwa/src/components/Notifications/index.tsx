'use client';

import { Drawer, DrawerContent, DrawerTitle } from '@repo/ui/components/drawer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { X } from 'lucide-react';
import { useState } from 'react';

import { NOTIFICATION_TABS, type NotificationTabId } from './mockData';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import {
  mapNotification,
  type DisplayNotification,
} from '@/lib/mappers/notification';

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationsDrawer = ({
  open,
  onClose,
}: NotificationsDrawerProps) => {
  const [activeTab, setActiveTab] = useState<NotificationTabId>('all');
  const { data: apiNotifications } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications: DisplayNotification[] = (apiNotifications ?? []).map(
    mapNotification,
  );

  const totalUnread = notifications.filter((n) => !n.read).length;

  const getFiltered = (tab: NotificationTabId) =>
    tab === 'all'
      ? notifications
      : notifications.filter((n) => n.category === tab);

  const getTabUnread = (tab: NotificationTabId) =>
    tab === 'all'
      ? totalUnread
      : notifications.filter((n) => !n.read && n.category === tab).length;

  const markAllRead = () => markAllReadMutation.mutate();

  const markRead = (id: string) => markReadMutation.mutate(id);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        className={cn(
          'bg-white rounded-t-[20px] border-none',
          'flex flex-col p-0',
          'h-[100dvh] data-[vaul-drawer-direction=bottom]:max-h-none',
          '[&>div:first-child]:hidden',
        )}
      >
        <DrawerTitle className="sr-only">Notifications</DrawerTitle>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#DDD9D3]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 shrink-0">
          <h2 className="text-[22px] font-medium text-[#1A1A18]">
            Notifications
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              onClick={markAllRead}
              className="h-auto px-2 py-1 text-[9px] font-semibold uppercase tracking-[1.8px] text-[#797168] hover:text-[#2B2824] hover:bg-transparent"
            >
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              aria-label="Close notifications"
              className="size-7 rounded-full border-[#E3E0DA] text-[#797168] hover:bg-[#F5F3F0] hover:text-[#2B2824]"
            >
              <X size={13} />
            </Button>
          </div>
        </div>

        {/* Shadcn Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as NotificationTabId)}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Tab triggers */}
          <TabsList
            variant="line"
            className={cn(
              'w-full h-auto rounded-none bg-transparent',
              'border-b border-[#E3E0DA] px-5 pb-0 pt-0',
              'justify-start gap-0',
            )}
          >
            {NOTIFICATION_TABS.map((tab) => {
              const count = getTabUnread(tab.id);
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'h-auto rounded-none pb-3 pr-5 pl-0 flex-none',
                    'text-[11px] font-medium',
                    'border-none bg-transparent shadow-none',
                    'text-[#B0AAA0] data-[state=active]:text-[#1A1A18]',
                    'data-[state=active]:after:bg-[#1A1A18]',
                    'after:bottom-0 after:h-[2px]',
                    'transition-colors duration-200',
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1 flex items-center justify-center size-4 rounded-full bg-[#1A1A18] text-[8px] font-bold text-white leading-none">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab content panels — fade + subtle slide on each switch */}
          {NOTIFICATION_TABS.map((tab) => {
            const filtered = getFiltered(tab.id);
            const unread = filtered.filter((n) => !n.read);
            const earlier = filtered.filter((n) => n.read);

            return (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex-1 overflow-y-auto mt-0',
                  'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1',
                  'data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0',
                  'duration-200',
                )}
              >
                {unread.length > 0 && (
                  <>
                    <SectionHeader label={`Unread · ${unread.length}`} />
                    {unread.map((n, i) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        isLast={i === unread.length - 1}
                        onRead={markRead}
                      />
                    ))}
                  </>
                )}

                {earlier.length > 0 && (
                  <>
                    <SectionHeader label="Earlier" />
                    {earlier.map((n, i) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        isLast={i === earlier.length - 1}
                        onRead={markRead}
                      />
                    ))}
                  </>
                )}

                {filtered.length === 0 && (
                  <p className="py-16 text-center text-[12px] text-[#B0AAA0]">
                    No notifications
                  </p>
                )}

                <div className="px-5 py-5">
                  <Button
                    variant="ghost"
                    className="w-full text-[10px] font-semibold uppercase tracking-[2px] text-[#797168] hover:text-[#2B2824] hover:bg-transparent"
                  >
                    All notifications
                  </Button>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 py-2 bg-[#F7F5F1]">
      <span className="text-[10px] font-medium text-[#9A9288]">{label}</span>
    </div>
  );
}

function NotificationItem({
  notification,
  isLast,
  onRead,
}: {
  notification: DisplayNotification;
  isLast: boolean;
  onRead: (id: string) => void;
}) {
  const { id, title, body, timestamp, read, Icon, iconBg, iconColor } =
    notification;

  return (
    <Button
      variant="ghost"
      onClick={() => !read && onRead(id)}
      className={cn(
        'w-full h-auto flex items-start gap-3 px-5 py-4 rounded-none justify-start',
        'hover:bg-[#FAFAF8]',
        !isLast && 'border-b border-[#F0EDE8]',
      )}
    >
      <div
        className={cn(
          'shrink-0 flex items-center justify-center size-10 rounded-full',
          iconBg,
        )}
      >
        <Icon size={16} className={iconColor} strokeWidth={1.75} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5 text-left">
        <p
          className={cn(
            'text-[13px] font-medium leading-snug',
            read ? 'text-[#B0AAA0]' : 'text-[#1A1A18]',
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            'mt-0.5 text-[12px] leading-snug whitespace-normal',
            read ? 'text-[#C4C0B8]' : 'text-[#797168]',
          )}
        >
          {body}
        </p>
        <p
          className={cn(
            'mt-1.5 text-[9px] font-medium uppercase tracking-[1.2px]',
            read ? 'text-[#C4C0B8]' : 'text-[#9A9288]',
          )}
        >
          {timestamp}
        </p>
      </div>

      {!read && (
        <div className="shrink-0 mt-1.5 size-2 rounded-full bg-[#2B2824]" />
      )}
    </Button>
  );
}
