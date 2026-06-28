import { api, API } from '@/lib/api';
import type { AuditLogEntry, AuditLogQuery } from '@repo/api-types';

export const auditApi = {
  list: (params?: AuditLogQuery) => {
    const search = new URLSearchParams();
    if (params?.search) search.set('search', params.search);
    if (params?.action) search.set('action', params.action);
    if (params?.from) search.set('from', params.from);
    if (params?.to) search.set('to', params.to);
    const qs = search.toString();
    return api.get<AuditLogEntry[]>(`${API.auditLog}${qs ? `?${qs}` : ''}`);
  },
};
