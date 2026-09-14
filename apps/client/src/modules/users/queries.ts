import { queryOptions } from '@tanstack/react-query';

import { UserService } from '@/services';

export const USERS_QUERY_KEY = ['users'] as const;

export const usersQueryOptions = () =>
  queryOptions({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => UserService.getAll(),
  });
