export interface CatalogItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  basePrice?: number | null;
  durationMinutes?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CatalogItemDetail extends CatalogItem {
  about?: string | null;
  longDescription?: string | null;
  included?: string[];
  maxGuests?: number | null;
  images?: string[];
}
