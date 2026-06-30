import { API, api } from '@/lib/api';

export interface SystemHealthResponse {
  uptimeSeconds: number;
  activeSessions: number;
  magicLinks30d: number;
  services: {
    key: string;
    name: string;
    connected: boolean;
    lastSyncAt: string | null;
  }[];
}

export const systemApi = {
  health: () => api.get<SystemHealthResponse>(API.system.health),
};
