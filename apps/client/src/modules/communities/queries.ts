import { queryOptions } from '@tanstack/react-query';

import { CommunityService } from '@/services';

export const COMMUNITIES_QUERY_KEY = ['communities'] as const;
export const COMMUNITY_KEY = [...COMMUNITIES_QUERY_KEY, 'detail'] as const;

export const communitiesQueryOptions = () =>
  queryOptions({
    queryKey: COMMUNITIES_QUERY_KEY,
    queryFn: () => CommunityService.getAll(),
  });

export const communityQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...COMMUNITY_KEY, id],
    queryFn: () => CommunityService.get(id),
  });
