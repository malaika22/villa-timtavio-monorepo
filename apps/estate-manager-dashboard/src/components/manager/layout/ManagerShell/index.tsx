'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@repo/ui/lib/utils';

import { ManagerPageHeader } from '@/components/manager/header/ManagerPageHeader';
import { ManagerSidebar } from '@/components/manager/sidebar/ManagerSidebar';
import { getDashboardSubtitle } from '@/components/manager/pages/dashboard/DashboardPage';
import { pageMeta } from '@/config/navigation';
import { useDashboardExport } from '@/hooks/useDashboard';
import { useLodgifySyncStatus } from '@/hooks/useSystem';
import { formatLodgifySyncLabel } from '@/lib/mappers/dashboard';
import { triggerOpenExperienceForm } from '@/lib/content-catalog-actions';

export const ManagerShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta['/'];
  const isDashboard = pathname === '/';
  const isContentCatalog = pathname === '/content';
  const exportQuery = useDashboardExport();

  const { data: lodgifyStatus } = useLodgifySyncStatus({
    enabled: isDashboard,
  });

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    const payload = result.data;
    if (!payload?.csv) return;

    const blob = new Blob([payload.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = payload.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lodgifySync = isDashboard
    ? formatLodgifySyncLabel(lodgifyStatus?.lastSyncAt ?? null)
    : undefined;

  const subtitle = isDashboard ? getDashboardSubtitle() : undefined;

  return (
    <div className="flex min-h-screen bg-manager-main">
      <ManagerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ManagerPageHeader
          meta={meta}
          lodgifySync={lodgifySync}
          subtitle={subtitle}
          onExport={isDashboard ? handleExport : undefined}
          isExporting={exportQuery.isFetching}
          onAddContentItem={
            isContentCatalog ? () => triggerOpenExperienceForm() : undefined
          }
        />
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
