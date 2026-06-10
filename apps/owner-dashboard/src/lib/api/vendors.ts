import { api, API } from '@/lib/api';
import type { Vendor, VendorDetail } from '@repo/api-types';

export const ownerVendorsApi = {
  list: () => api.get<Vendor[]>(API.vendors.list),
  byId: (id: string) => api.get<VendorDetail>(API.vendors.byId(id)),
};
