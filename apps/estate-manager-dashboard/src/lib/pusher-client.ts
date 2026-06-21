import { config } from '@/config/config';
import PusherClient from 'pusher-js';

let pusherInstance: PusherClient | null = null;

export async function getDashboardPusherClient(): Promise<PusherClient> {
  if (pusherInstance) return pusherInstance;

  const { key, cluster } = config.pusher;
  if (!key || !cluster) {
    throw new Error('Pusher is not configured for the estate manager dashboard');
  }

  const tokenRes = await fetch('/api/auth/token');
  if (!tokenRes.ok) {
    throw new Error('Unable to fetch access token for Pusher auth');
  }

  const { accessToken } = (await tokenRes.json()) as { accessToken?: string };
  if (!accessToken) {
    throw new Error('Missing access token for Pusher auth');
  }

  pusherInstance = new PusherClient(key, {
    cluster,
    channelAuthorization: {
      endpoint: `${config.apiUrl}/api/v1/pusher/auth-em`,
      transport: 'ajax',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  return pusherInstance;
}

export function disconnectDashboardPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
