import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api/audit';
import type { AuditLogQuery } from '@repo/api-types';

export function useAuditLog(params: AuditLogQuery) {
  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => auditApi.list(params),
  });
}
