import { DashboardCard } from '@repo/dashboard-ui';

export function SectionEmptyState({
  message,
  description,
}: {
  message: string;
  description?: string;
}) {
  return (
    <DashboardCard variant="manager" className="rounded-xl">
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm font-medium text-manager-text">{message}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-manager-text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </DashboardCard>
  );
}
