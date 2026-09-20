import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MinistryService, type MinistriesQuery } from '@/services';

import {
  MINISTRIES_QUERY_KEY,
  MINISTRY_KEY,
  ministryQueryOptions,
  ministriesQueryOptions,
} from './queries';

export const useMinistries = (query: MinistriesQuery = {}, enabled = true) =>
  useQuery({ ...ministriesQueryOptions(query), enabled });

export const useMinistry = (id: string) => useQuery(ministryQueryOptions(id));

export const useCreateMinistry = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string; communityId: string }) =>
      MinistryService.createMinistry(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY }),
  });

  return {
    createMinistry: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useUpdateMinistry = (id: string) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string; communityId: string; leaderId: string | null }) =>
      MinistryService.updateMinistry(id, data),
    onSuccess: async (ministry) => {
      queryClient.setQueryData([...MINISTRY_KEY, id], ministry);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    updateMinistry: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useDeleteMinistry = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => MinistryService.deleteMinistry(id),
    onSuccess: async (_ministry, id) => {
      queryClient.removeQueries({ queryKey: [...MINISTRY_KEY, id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MINISTRIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    deleteMinistry: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
