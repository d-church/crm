import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GatheringService, type AttendanceStatus, type GatheringPayload } from '@/services';

export const GATHERINGS_KEY = ['gatherings'] as const;

export const useGathering = (id: string) =>
  useQuery({
    queryKey: [...GATHERINGS_KEY, 'detail', id] as const,
    queryFn: () => GatheringService.get(id),
  });

export const useRoster = (id: string) =>
  useQuery({
    queryKey: [...GATHERINGS_KEY, 'roster', id] as const,
    queryFn: () => GatheringService.roster(id),
  });

export const useAttendance = (id: string, enabled = true) =>
  useQuery({
    queryKey: [...GATHERINGS_KEY, 'attendance', id] as const,
    queryFn: () => GatheringService.attendance(id),
    enabled,
  });

export const useGatheringTypes = () =>
  useQuery({ queryKey: ['gathering-types'] as const, queryFn: () => GatheringService.types() });

export const useCreateGathering = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: GatheringPayload) => GatheringService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GATHERINGS_KEY }),
  });

  return { createGathering: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useMarkAttendance = (id: string) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (marks: { personId: string; status: AttendanceStatus }[]) =>
      GatheringService.mark(id, marks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GATHERINGS_KEY }),
  });

  return { mark: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useRemoveGathering = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => GatheringService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GATHERINGS_KEY }),
  });

  return { removeGathering: mutation.mutateAsync, isPending: mutation.isPending };
};
