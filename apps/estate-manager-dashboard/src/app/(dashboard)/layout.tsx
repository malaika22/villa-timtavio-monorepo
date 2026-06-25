'use client';

import { ManagerShell } from '@/components/manager/layout/ManagerShell';
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
      <DashboardRealtime>{children}</DashboardRealtime>
    </ManagerShell>
  );
}
