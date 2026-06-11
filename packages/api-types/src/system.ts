export interface DailyRevenue {
  total: number;
  currency: string;
  date: string;
}

export interface LodgifySyncStatus {
  lastSyncAt: string | null;
}

export interface SystemAlert {
  id: string;
  severity: string;
  title: string;
  message: string;
  category: string;
  isDismissed: boolean;
  dismissedBy?: string | null;
  dismissedAt?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}
