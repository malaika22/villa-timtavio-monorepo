import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emVendorsApi } from '@/lib/api/vendors';
import type {
  CreateVendorDto,
  VendorStatus,
  AddVendorRatingDto,
} from '@repo/api-types';

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: emVendorsApi.list,
    staleTime: 60_000,
  });
}

export function useVendorById(id: string | null) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => emVendorsApi.byId(id!),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVendorDto) => emVendorsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorStatus }) =>
      emVendorsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

export function useAddVendorRating() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AddVendorRatingDto) => emVendorsApi.addRating(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}
