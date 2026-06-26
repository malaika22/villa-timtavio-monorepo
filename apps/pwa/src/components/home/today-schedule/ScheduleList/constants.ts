import { ExperienceStatus } from '@/types/experienceStatus';
import { RequestStatus } from '@repo/api-types';

export const MAX_UPCOMING_EXPERIENCES = 2;

export const STATUS_MAP: Record<RequestStatus, ExperienceStatus> = {
  PENDING: ExperienceStatus.PENDING,
  CONFLICT: ExperienceStatus.PENDING,
  CONFIRMED: ExperienceStatus.CONFIRMED,
  IN_PROGRESS: ExperienceStatus.IN_PROGRESS,
  READY: ExperienceStatus.READY,
  COMPLETED: ExperienceStatus.COMPLETED,
  CANCELLED: ExperienceStatus.CANCELLED,
};
