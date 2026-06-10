import { api, API } from '@/lib/api';
import type { Room } from '@repo/api-types';

export const ownerRoomsApi = {
  list: () => api.get<Room[]>(API.rooms.list),
};
