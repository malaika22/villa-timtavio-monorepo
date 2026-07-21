// Local mirrors of the dining contract types. The Nest app uses CommonJS module
// resolution and doesn't consume @repo/api-types directly, so these are kept in
// sync with packages/api-types/src/dining.ts by hand.

export interface SittingTimes {
  BREAKFAST: string[];
  LUNCH: string[];
  DINNER: string[];
}

export type UpdateSittingTimesDto = SittingTimes;

export interface DiningLateArrival {
  email: string;
  name: string;
  note?: string | null;
  allergies?: string | null;
  at: string;
}

export interface AddLateArrivalDto {
  note?: string;
  allergies?: string;
}
