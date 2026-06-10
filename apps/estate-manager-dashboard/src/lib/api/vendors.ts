import { api, API } from '@/lib/api';
import type {
  Vendor,
  VendorDetail,
  CreateVendorDto,
  UpdateVendorStatusDto,
  AddVendorRatingDto,
  VendorRating,
  VendorStatus,
} from '@repo/api-types';

export const emVendorsApi = {
  list: () => api.get<Vendor[]>(API.vendors.list),
  byId: (id: string) => api.get<VendorDetail>(API.vendors.byId(id)),
  create: (dto: CreateVendorDto) => api.post<Vendor>(API.vendors.list, dto),
  updateStatus: (id: string, status: VendorStatus) =>
    api.patch<Vendor>(API.vendors.status(id), {
      status,
    } as UpdateVendorStatusDto),
  addRating: (dto: AddVendorRatingDto) =>
    api.post<VendorRating>(API.vendors.ratings, dto),
};
