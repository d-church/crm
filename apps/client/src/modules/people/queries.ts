import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { PersonService, type PeopleQuery } from '@/services';

export const PEOPLE_QUERY_KEY = ['people'] as const;

export const PEOPLE_LIST_KEY = [...PEOPLE_QUERY_KEY, 'list'] as const;
export const PEOPLE_STATS_KEY = [...PEOPLE_QUERY_KEY, 'stats'] as const;
export const PEOPLE_CHOICES_KEY = [...PEOPLE_QUERY_KEY, 'choices'] as const;
export const PERSON_KEY = [...PEOPLE_QUERY_KEY, 'detail'] as const;

export const peopleQueryOptions = (query: PeopleQuery) =>
  queryOptions({
    queryKey: [...PEOPLE_LIST_KEY, query],
    queryFn: () => PersonService.list(query),
    // Keeps the previous page on screen while the next one loads, instead of
    // collapsing the table into a skeleton on every page change.
    placeholderData: keepPreviousData,
  });

/** Whole-base totals — independent of the filters, so they get their own key. */
export const peopleStatsQueryOptions = () =>
  queryOptions({
    queryKey: PEOPLE_STATS_KEY,
    queryFn: () => PersonService.stats(),
  });

export const peopleChoicesQueryOptions = () =>
  queryOptions({
    queryKey: PEOPLE_CHOICES_KEY,
    queryFn: () => PersonService.choices(),
  });

export const personQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...PERSON_KEY, id],
    queryFn: () => PersonService.get(id),
  });
