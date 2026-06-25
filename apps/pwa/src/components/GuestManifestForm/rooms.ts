export type RoomOption = {
  id: string;
  name: string;
  suiteLabel: string;
  filled: number;
  capacity: number;
  bedConfig?: string;
  totalBeds?: number;
  bathrooms?: number;
};

export const ROOM_OPTIONS: RoomOption[] = [
  {
    id: 'r1',
    name: 'Room 1',
    suiteLabel: 'King Master Suite',
    filled: 0,
    capacity: 2,
  },
  {
    id: 'r2',
    name: 'Room 2',
    suiteLabel: 'Garden Suite',
    filled: 2,
    capacity: 2,
  },
  {
    id: 'r3',
    name: 'Room 3',
    suiteLabel: 'Deluxe Double',
    filled: 0,
    capacity: 4,
  },
  {
    id: 'r4',
    name: 'Room 4',
    suiteLabel: 'Luxury Bunk Room',
    filled: 2,
    capacity: 4,
  },
  {
    id: 'r5',
    name: 'Room 5',
    suiteLabel: 'Pool Villa Wing',
    filled: 0,
    capacity: 2,
  },
  {
    id: 'r6',
    name: 'Room 6',
    suiteLabel: 'Terrace Junior Suite',
    filled: 1,
    capacity: 2,
  },
];

export function isRoomFull(room: RoomOption): boolean {
  return room.filled >= room.capacity;
}

export function formatRoomSelectLabel(room: RoomOption): string {
  const spots = `${room.filled} of ${room.capacity} spots filled`;
  if (isRoomFull(room)) {
    return `${room.name} — ${room.suiteLabel} (${spots}) — Full`;
  }
  return `${room.name} — ${room.suiteLabel} (${spots})`;
}

export function formatRoomSummary(room: RoomOption): string {
  if (isRoomFull(room)) return `${room.name} · Full`;
  return `${room.name} · ${room.filled}/${room.capacity}`;
}
