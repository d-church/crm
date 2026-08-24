import { queryOptions } from '@tanstack/react-query';

import { AuthService } from '@/services';

export const ME_QUERY_KEY = ['me'] as const;

export const meQueryOptions = () =>
  queryOptions({
    queryKey: ME_QUERY_KEY,
    queryFn: () => AuthService.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
