export type DashboardMetricCard = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral' | 'warning';
  subtext?: string;
};

export type StatusPillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
