import { ExperienceStatus } from './experienceStatus';

export type ExperienceCatalogFilter =
  | 'water'
  | 'culinary'
  | 'wellness'
  | 'private'
  | 'adventure';

export type ExperienceFilterId = ExperienceCatalogFilter | 'all';

export interface Experience {
  id: string;
  /** Label shown on the image pill */
  category: string;
  /** Used for filter chips on /experiences */
  filterCategory: ExperienceCatalogFilter;
  title: string;
  /** Shown as "N HRS" when `durationMinutes` is not set */
  experienceHours?: number;
  /** When set, meta line uses "N MIN" instead of hours */
  durationMinutes?: number;
  image: string;
  /**
   * Drives card chrome: Request, status chip, lock overlay, Request again, etc.
   * Use COMPLETED for experiences the guest has finished (shows Request again).
   * Use LOCKED_PRE_ARRIVAL for pre-check-in locked catalog items.
   */
  status: ExperienceStatus;
}

export interface ExperienceHost {
  name: string;
  /** e.g. "Private Chef" */
  role: string;
  /** Category tag shown below role, e.g. "Culinary" */
  category: string;
  avatar: string;
  reviewNote?: string;
}

export interface ExperienceTimeSlot {
  id: string;
  label: string;
  time: string;
  disabled?: boolean;
}

export interface ExperienceDetailData {
  /** Multiple images for the carousel; falls back to experience.image */
  images?: string[];
  /** Primary description paragraph (bold/prominent) */
  about: string;
  /** Secondary description paragraph (lighter) */
  longDescription?: string;
  included: string[];
  host?: ExperienceHost;
  /** Display string for the available date, e.g. "26TH MARCH" */
  availableDate?: string;
  availableTimes?: ExperienceTimeSlot[];
  maxGuests?: number;
  /** Price unit label, e.g. "per villa" */
  priceUnit?: string;
  /** Base price used in request flow summary */
  basePrice?: number;
}
