import { queryOptions } from '@tanstack/react-query';

import { PersonService } from '@/services';

export const PEOPLE_QUERY_KEY = ['people'] as const;

export const peopleQueryOptions = () =>
  queryOptions({
    queryKey: PEOPLE_QUERY_KEY,
    queryFn: () => PersonService.getAll(),
  });

export const personQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...PEOPLE_QUERY_KEY, id],
    queryFn: () => PersonService.get(id),
  });
