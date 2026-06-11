import { api, API } from '@/lib/api';
import type {
  Vendor,
  VendorDetail,
  CreateVendorDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
  AddVendorRatingDto,
  VendorRating,
  VendorStatus,
} from '@repo/api-types';

export const emVendorsApi = {
  list: () => api.get<Vendor[]>(API.vendors.list),
  byId: (id: string) => api.get<VendorDetail>(API.vendors.byId(id)),
  create: (dto: CreateVendorDto) => api.post<Vendor>(API.vendors.list, dto),
  update: (id: string, dto: UpdateVendorDto) =>
    api.patch<Vendor>(API.vendors.byId(id), dto),
  updateStatus: (id: string, status: VendorStatus) =>
    api.patch<Vendor>(API.vendors.status(id), {
      status,
    } as UpdateVendorStatusDto),
  addRating: (dto: AddVendorRatingDto) =>
    api.post<VendorRating>(API.vendors.ratings, dto),
};
