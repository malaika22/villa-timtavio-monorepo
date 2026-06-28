import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import type { EstateSettings, StaffRole } from '@repo/api-types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<EstateSettings>) => settingsApi.update(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useStaffAccounts() {
  return useQuery({
    queryKey: ['settings', 'staff'],
    queryFn: settingsApi.listStaff,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; email: string; role?: StaffRole }) =>
      settingsApi.createStaff(dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['settings', 'staff'] }),
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: { role?: StaffRole; active?: boolean };
    }) => settingsApi.updateStaff(id, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['settings', 'staff'] }),
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['settings', 'integrations'],
    queryFn: settingsApi.integrations,
    refetchInterval: 60_000,
  });
}
