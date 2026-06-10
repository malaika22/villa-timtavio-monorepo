import { EXPERIENCES_MOCK_DATA } from '@/data/experiencesMockData';
import { BookingStatus } from '@repo/api-types';

export const PAGE_SIZE = 4;
export const CATALOG_TOTAL = EXPERIENCES_MOCK_DATA.length;

export const bookingStatusMap: Record<string, BookingStatus> = {
  'pre-arrival': 'CONFIRMED',
  'checked-in': 'CHECKED_IN',
  settled: 'SETTLED',
  'departure-today': 'DEPARTURE_TODAY',
  'checkout-out': 'CHECKED_OUT',
};
