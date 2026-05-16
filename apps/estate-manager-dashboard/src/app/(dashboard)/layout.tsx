import { ManagerShell } from '@/components/manager/layout/ManagerShell';

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerShell>{children}</ManagerShell>;
}
