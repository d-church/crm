import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CommunityService } from '@/services';

import { COMMUNITIES_QUERY_KEY, communitiesQueryOptions } from './queries';

export const useCommunities = () => useQuery(communitiesQueryOptions());

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createCommunity,
    isPending,
    error,
  } = useMutation({
    mutationFn: (name: string) => CommunityService.createCommunity({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMUNITIES_QUERY_KEY }),
  });

  return { createCommunity, isPending, error };
};
