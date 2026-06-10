export type ExperienceRequestStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';

export interface ExperienceRequest {
  id: string;
  bookingId: string;
  catalogItemId: string;
  status: ExperienceRequestStatus;
  requestedDate?: string | null;
  scheduledDate?: string | null;
  guestCount?: number | null;
  specialRequests?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperienceRequestDto {
  catalogItemId: string;
  requestedDate?: string;
  preferredTimeId?: string;
  guestCount?: number;
  specialRequests?: string;
}
