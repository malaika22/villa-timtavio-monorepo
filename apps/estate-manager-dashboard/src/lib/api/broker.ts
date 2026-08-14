import { api, API } from '@/lib/api';
import type { BrokerHold } from '@repo/api-types';

export const emBrokerApi = {
  /** Live holds first, then whatever was resolved in the last fortnight. */
  holds: () => api.get<BrokerHold[]>(API.broker.holds),
  confirm: (id: string) => api.post<BrokerHold>(API.broker.confirmHold(id)),
  release: (id: string, note?: string) =>
    api.post<BrokerHold>(API.broker.releaseHold(id), { note }),
};
