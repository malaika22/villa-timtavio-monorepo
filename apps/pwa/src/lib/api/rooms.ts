import { api, API } from '@/lib/api';
import type { Room, RoomWithAvailability } from '@repo/api-types';

export const roomsApi = {
  list: () => api.get<Room[]>(API.rooms.list),
  availability: (bookingId: string) =>
    api.get<RoomWithAvailability[]>(API.rooms.availability(bookingId)),
};
