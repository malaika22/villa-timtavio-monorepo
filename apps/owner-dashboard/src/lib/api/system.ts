import { API, api } from '@/lib/api';

export interface SystemHealthResponse {
  uptimeSeconds: number;
  uptimePercent: number | null;
  avgResponseMs: number | null;
  sampleCount: number;
  activeSessions: number;
  magicLinks30d: number;
  services: {
    key: string;
    name: string;
    connected: boolean;
    lastSyncAt: string | null;
  }[];
  history: {
    date: string;
    status: 'operational' | 'degraded' | 'outage' | 'no-data';
  }[];
  incidents: { startedAt: string; endedAt: string; samples: number }[];
}

export interface ActiveSessionRow {
  id: string;
  name: string;
  initials: string;
  role: string;
  sessionStartAt: string | null;
}

export const systemApi = {
  health: () => api.get<SystemHealthResponse>(API.system.health),
  activeSessions: () => api.get<ActiveSessionRow[]>(API.system.activeSessions),
};
