'use client';

import { ManagerShell } from '@/components/manager/layout/ManagerShell';
import { TokenInitializer } from '@/components/manager/TokenInitializer';
import { useEmPusher } from '@/hooks/use-em-pusher';

function DashboardRealtime({ children }: { children: React.ReactNode }) {
  useEmPusher();
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
