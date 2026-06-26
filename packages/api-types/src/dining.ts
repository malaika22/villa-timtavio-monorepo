import type { MenuCategory } from './catalog';

export type DiningRequestKind = 'SITTING' | 'ORDER';
export type DiningRequestStatus = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED';

/** Meal types eligible for a sit-down reservation. */
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface DiningOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
}

export interface DiningRequest {
  id: string;
  bookingId: string;
  requestedByEmail: string;
  requestedByName: string;
  kind: DiningRequestKind;
  status: DiningRequestStatus;

  // SITTING
  mealType?: MenuCategory | null;
  date?: string | null;
  time?: string | null;
  partySize?: number | null;
  allergies?: string | null;
  specialRequests?: string | null;

  // ORDER
  items?: DiningOrderItem[] | null;
  requestedFor?: string | null;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateDiningSittingDto {
  kind: 'SITTING';
  mealType: MealType;
  date: string;
  time: string;
  partySize: number;
  allergies?: string;
  specialRequests?: string;
}

export interface CreateDiningOrderDto {
  kind: 'ORDER';
  items: DiningOrderItem[];
  requestedFor?: string;
  notes?: string;
}

export type CreateDiningRequestDto =
  | CreateDiningSittingDto
  | CreateDiningOrderDto;

/** Create/update payload for an estate-manager-managed menu item. */
export interface MenuItemDto {
  name: string;
  category: MenuCategory;
  description?: string;
  photoUrl?: string;
  isActive?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  containsNuts?: boolean;
  containsDairy?: boolean;
  containsShellfish?: boolean;
  otherDietaryNotes?: string;
  sortOrder?: number;
}
