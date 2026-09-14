import { queryOptions } from '@tanstack/react-query';

import { HomeGroupService } from '@/services';

export const HOME_GROUPS_QUERY_KEY = ['home-groups'] as const;
export const HOME_GROUP_KEY = [...HOME_GROUPS_QUERY_KEY, 'detail'] as const;

export const homeGroupsQueryOptions = () =>
  queryOptions({
    queryKey: HOME_GROUPS_QUERY_KEY,
    queryFn: () => HomeGroupService.getAll(),
  });

export const homeGroupQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...HOME_GROUP_KEY, id],
    queryFn: () => HomeGroupService.get(id),
  });
