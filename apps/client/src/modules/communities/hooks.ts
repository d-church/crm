import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CommunityService, type Writable } from '@/services';

import {
  COMMUNITIES_QUERY_KEY,
  COMMUNITY_KEY,
  communitiesQueryOptions,
  communityQueryOptions,
} from './queries';

export const useCommunities = () => useQuery(communitiesQueryOptions());

export const useCommunity = (id: string) => useQuery(communityQueryOptions(id));

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createCommunity,
    isPending,
    error,
  } = useMutation({
    mutationFn: (name: string) => CommunityService.createCommunity({ name, sortOrder: 100 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY }),
  });

  return { createCommunity, isPending, error };
};

export const useUpdateCommunity = (id: string) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: updateCommunity,
    isPending,
    error,
  } = useMutation({
    mutationFn: (
      data: Pick<Writable<{ name: string; sortOrder: number }>, 'name' | 'sortOrder'> & {
        leaderId: string | null;
      },
    ) => CommunityService.updateCommunity(id, data),
    onSuccess: async (community) => {
      queryClient.setQueryData([...COMMUNITY_KEY, id], community);
      await queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY });
    },
  });

  return { updateCommunity, isPending, error };
};

export const useDeleteCommunity = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: deleteCommunity,
    isPending,
    error,
  } = useMutation({
    mutationFn: (id: string) => CommunityService.deleteCommunity(id),
    onSuccess: async (_community, id) => {
      queryClient.removeQueries({ queryKey: [...COMMUNITY_KEY, id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY }),
        // Removing memberships also changes people rows and the "у спільноті" total.
        queryClient.invalidateQueries({ queryKey: ['people'] }),
        queryClient.invalidateQueries({ queryKey: ['ministries'] }),
      ]);
    },
  });

  return { deleteCommunity, isPending, error };
};
