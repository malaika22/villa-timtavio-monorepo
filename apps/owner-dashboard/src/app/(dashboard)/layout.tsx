import { IntelligenceShell } from '@/components/intelligence/layout/IntelligenceShell';

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IntelligenceShell>{children}</IntelligenceShell>;
}
