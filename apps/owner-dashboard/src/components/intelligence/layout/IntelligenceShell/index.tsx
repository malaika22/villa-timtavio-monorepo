'use client';

import { usePathname } from 'next/navigation';

import { PageHeader } from '@/components/intelligence/header/PageHeader';
import { IntelligenceSidebar } from '@/components/intelligence/sidebar/IntelligenceSidebar';
import { pageMeta } from '@/config/navigation';

export const IntelligenceShell = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? pageMeta['/'];

  return (
    <div className="flex min-h-screen bg-intel-main">
      <IntelligenceSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PageHeader meta={meta} />
        <main className="flex-1 overflow-auto p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
};
