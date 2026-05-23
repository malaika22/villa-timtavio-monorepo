'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';

import { ManagerPageHeader } from '@/components/manager/header/ManagerPageHeader';
import { ManagerSidebar } from '@/components/manager/sidebar/ManagerSidebar';
import { pageMeta } from '@/config/navigation';

export const ManagerShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta['/'];

  return (
    <div className="flex min-h-screen bg-manager-main">
      <ManagerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ManagerPageHeader meta={meta} />
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            meta.fullBleed ? 'overflow-hidden' : 'overflow-auto p-4 lg:p-5',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
