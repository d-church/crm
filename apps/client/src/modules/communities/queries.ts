import { queryOptions } from '@tanstack/react-query';

import { CommunityService } from '@/services';

export const COMMUNITIES_QUERY_KEY = ['communities'] as const;

export const communitiesQueryOptions = () =>
  queryOptions({
    queryKey: COMMUNITIES_QUERY_KEY,
    queryFn: () => CommunityService.getAll(),
  });
