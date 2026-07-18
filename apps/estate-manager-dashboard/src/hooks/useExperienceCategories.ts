'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { experienceCategoriesApi } from '@/lib/api/experience-categories';
import type {
  CreateExperienceCategoryDto,
  UpdateExperienceCategoryDto,
} from '@repo/api-types';

export function useExperienceCategories(includeInactive = true) {
  return useQuery({
    queryKey: ['experience-categories', { includeInactive }],
    queryFn: () => experienceCategoriesApi.list(includeInactive),
    staleTime: 60_000,
  });
}

export function useCreateExperienceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExperienceCategoryDto) =>
      experienceCategoriesApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['experience-categories'],
      });
    },
  });
}

export function useUpdateExperienceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateExperienceCategoryDto;
    }) => experienceCategoriesApi.update(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['experience-categories'],
      });
    },
  });
}

export function useDeleteExperienceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => experienceCategoriesApi.delete(id),
    // Refetch after every attempt (success OR error) so a stale/already-deleted
    // category can't get stuck in the list and keep 404-ing.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ['experience-categories'],
      });
    },
  });
}
