import type { FolioGuestSpend } from '@repo/api-types';
import { FolioMeta } from '../mockData';

export interface FolioLineItemsProps {
  data: FolioMeta;
  /** Per-guest spend. Omitted when the party is just the primary. */
  byGuest?: FolioGuestSpend[];
}
