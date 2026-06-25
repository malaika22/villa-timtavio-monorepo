import { api, API } from '@/lib/api';
import type {
  Room,
  RoomWithAvailability,
  CreateRoomDto,
  UpdateRoomDto,
} from '@repo/api-types';

export const emRoomsApi = {
  list: () => api.get<Room[]>(API.rooms.list),
  availability: (bookingId: string) =>
    api.get<RoomWithAvailability[]>(API.rooms.availability(bookingId)),
  create: (dto: CreateRoomDto) => api.post<Room>(API.rooms.list, dto),
  update: (number: number, dto: UpdateRoomDto) =>
    api.patch<Room>(API.rooms.byNumber(number), dto),
  toggleActive: (number: number) =>
    api.patch<Room>(API.rooms.toggleActive(number)),
};
