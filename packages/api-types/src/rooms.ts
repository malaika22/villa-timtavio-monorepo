import type { RoomType } from './bookings';
export type { RoomType };

export interface Room {
  number: number;
  name: string;
  type: RoomType;
  capacity: number;
  bedConfig: string;
  floorLevel?: number | null;
  isActive: boolean;
}

export interface RoomWithAvailability extends Room {
  assignedGuests: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  availableCapacity: number;
}

export interface CreateRoomDto {
  number: number;
  name: string;
  type: RoomType;
  capacity: number;
  bedConfig: string;
  floorLevel?: number;
}

export interface UpdateRoomDto extends Partial<Omit<CreateRoomDto, 'number'>> {
  isActive?: boolean;
}
