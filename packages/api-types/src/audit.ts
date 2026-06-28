export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedByRole: string;
  bookingId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogQuery {
  search?: string;
  action?: string;
  from?: string;
  to?: string;
}
