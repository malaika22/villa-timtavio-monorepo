export function derivePrimaryRoomNumber(
  manifestGuests: { email: string; roomNumber: number | null }[],
  primaryGuestEmail: string,
): number | null {
  const primaryManifest = manifestGuests.find(
    (guest) => guest.email === primaryGuestEmail,
  );
  if (primaryManifest?.roomNumber != null) {
    return primaryManifest.roomNumber;
  }

  const assigned = manifestGuests.find((guest) => guest.roomNumber != null);
  return assigned?.roomNumber ?? null;
}

export function formatVillaLabel(roomNumber: number | null): string {
  return roomNumber != null ? `Villa ${roomNumber}` : 'Villa TimTavio';
}
