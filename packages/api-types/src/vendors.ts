export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Vendor {
  id: string;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  serviceDescription?: string | null;
  status: VendorStatus;
  averageRating?: number | null;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
  catalogItems?: { id: string; name: string; category: string }[];
  _count?: { vendorRatings: number };
}

export interface VendorRating {
  id: string;
  vendorId: string;
  experienceRequestId: string;
  rating: number;
  notes?: string | null;
  createdAt: string;
}

export interface VendorDetail extends Vendor {
  vendorRatings: (VendorRating & {
    experienceRequest: {
      id: string;
      catalogItem: { id: string; name: string };
      preferredDate: string;
      status: string;
    };
  })[];
}

export interface CreateVendorDto {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  serviceDescription?: string;
  status?: VendorStatus;
}

export interface UpdateVendorStatusDto {
  status: VendorStatus;
}

export interface AddVendorRatingDto {
  experienceRequestId: string;
  rating: number;
  notes?: string;
}
