import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { HomeGroupService } from '@/services';

import {
  HOME_GROUP_KEY,
  HOME_GROUPS_QUERY_KEY,
  homeGroupQueryOptions,
  homeGroupsQueryOptions,
} from './queries';

export const useHomeGroups = () => useQuery(homeGroupsQueryOptions());

export const useHomeGroup = (id: string) => useQuery(homeGroupQueryOptions(id));

export const useCreateHomeGroup = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string; address: string | null }) =>
      HomeGroupService.createHomeGroup(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOME_GROUPS_QUERY_KEY }),
  });

  return {
    createHomeGroup: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useUpdateHomeGroup = (id: string) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { name: string; address: string | null; leaderId: string | null }) =>
      HomeGroupService.updateHomeGroup(id, data),
    onSuccess: async (homeGroup) => {
      queryClient.setQueryData([...HOME_GROUP_KEY, id], homeGroup);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: HOME_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    updateHomeGroup: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useDeleteHomeGroup = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => HomeGroupService.deleteHomeGroup(id),
    onSuccess: async (_homeGroup, id) => {
      queryClient.removeQueries({ queryKey: [...HOME_GROUP_KEY, id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: HOME_GROUPS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['people'] }),
      ]);
    },
  });

  return {
    deleteHomeGroup: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
