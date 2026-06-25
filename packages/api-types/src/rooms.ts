import type { RoomType } from './bookings';
export type { RoomType };

export type BedType =
  | 'king'
  | 'queen'
  | 'double'
  | 'twin'
  | 'single'
  | 'bunk'
  | 'sofa';

export interface Bed {
  type: BedType;
  count: number;
}

export type RoomAmenity =
  | 'balcony'
  | 'ac'
  | 'pool_view'
  | 'ocean_view'
  | 'walk_in_closet'
  | 'workspace'
  | 'smart_tv'
  | 'minibar';

export const BED_LABELS: Record<BedType, string> = {
  king: 'King bed',
  queen: 'Queen bed',
  double: 'Double bed',
  twin: 'Twin bed',
  single: 'Single bed',
  bunk: 'Bunk bed',
  sofa: 'Sofa bed',
};

export const AMENITY_LABELS: Record<RoomAmenity, string> = {
  balcony: 'Balcony',
  ac: 'Air conditioning',
  pool_view: 'Pool view',
  ocean_view: 'Ocean view',
  walk_in_closet: 'Walk-in closet',
  workspace: 'Workspace',
  smart_tv: 'Smart TV',
  minibar: 'Minibar',
};

export interface Room {
  number: number;
  name: string;
  type: RoomType;
  capacity: number;
  bedConfig: string;
  beds: Bed[];
  bathrooms: number;
  ensuite: boolean;
  amenities: RoomAmenity[];
  description?: string | null;
  imageUrl?: string | null;
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
  beds?: Bed[];
  bathrooms?: number;
  ensuite?: boolean;
  amenities?: RoomAmenity[];
  description?: string;
  imageUrl?: string;
  floorLevel?: number;
}

export interface UpdateRoomDto extends Partial<Omit<CreateRoomDto, 'number'>> {
  isActive?: boolean;
}
