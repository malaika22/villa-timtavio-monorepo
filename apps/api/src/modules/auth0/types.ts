import { Role } from '../../commons/types/role';
import { GuestTier } from '../../commons/types/guest';

export interface CreateOrUpdateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  bookingId: string;
  guestTier: GuestTier;
}

export interface ManagementToken {
  token: string;
  expiresAt: number;
}

export interface SendMagicLinkPayload {
  email: string;
  firstName: string;
  lastName: string;
  bookingId: string;
  role: Role;
  guestTier: GuestTier;
  checkOutDate: Date;
}
