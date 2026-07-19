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
