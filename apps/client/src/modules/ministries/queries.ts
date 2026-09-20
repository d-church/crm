import { queryOptions } from '@tanstack/react-query';

import { MinistryService, type MinistriesQuery } from '@/services';

export const MINISTRIES_QUERY_KEY = ['ministries'] as const;
export const MINISTRY_KEY = [...MINISTRIES_QUERY_KEY, 'detail'] as const;

export const ministriesQueryOptions = (query: MinistriesQuery = {}) =>
  queryOptions({
    queryKey: [...MINISTRIES_QUERY_KEY, 'list', query],
    queryFn: () => MinistryService.list(query),
  });

export const ministryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...MINISTRY_KEY, id],
    queryFn: () => MinistryService.get(id),
  });
