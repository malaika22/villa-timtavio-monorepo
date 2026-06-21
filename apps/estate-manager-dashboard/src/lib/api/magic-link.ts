import { api, API } from '@/lib/api';
import type { SendMagicLinkResponse } from '@repo/api-types';

export const emMagicLinkApi = {
  send: (bookingId: string) =>
    api.post<SendMagicLinkResponse>(API.magicLink.send(bookingId)),
};
