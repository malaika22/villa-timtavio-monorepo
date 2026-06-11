'use client';

import { ManagerShell } from '@/components/manager/layout/ManagerShell';
import { TokenInitializer } from '@/components/manager/TokenInitializer';
import { useEmRealtime } from '@/hooks/useEmRealtime';

function DashboardRealtime({ children }: { children: React.ReactNode }) {
  useEmRealtime();
  return children;
}

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ManagerShell>
      <TokenInitializer />
      <DashboardRealtime>{children}</DashboardRealtime>
    </ManagerShell>
  );
}
