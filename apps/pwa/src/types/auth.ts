import { GuestTier } from './guest';

export interface AuthUser {
  auth0Id: string;
  email: string;
  firstName: string;
  roles: string[];
  bookingId: string;
  guestTier: GuestTier;
  accessToken: string;
  tokenExpiry: number;
}
