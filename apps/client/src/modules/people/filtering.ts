import { z } from 'zod';

import { getAge } from '@/lib/format';
import {
  PEOPLE_SORTS,
  type PeopleQuery,
  type PeopleSort,
  type Person,
  type PersonStatus,
} from '@/services';

import { PERSON_STATUSES } from './status';

/** Sentinel for the "no filter" choice in the dropdowns and status pills. */
export const ANY = 'ANY';

export const PAGE_SIZE = 25;

export const DEFAULT_SORT: PeopleSort = 'createdAt';

export const SORT_LABELS: Record<PeopleSort, string> = {
  createdAt: 'За датою додавання',
  lastSeenAt: 'За останньою зустріччю',
  name: 'За іменем',
  status: 'За статусом',
};

/**
 * Filters live in the URL, so a filtered list can be shared, bookmarked and
 * walked with the back button. Everything is optional — defaults stay out of the
 * URL instead of cluttering it.
 */
export const peopleSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  status: z.enum(PERSON_STATUSES as [PersonStatus, ...PersonStatus[]]).optional(),
  community: z.string().max(80).optional(),
  ministry: z.string().max(80).optional(),
  sort: z.enum([...PEOPLE_SORTS]).optional(),
});

export type PeopleSearch = z.infer<typeof peopleSearchSchema>;

/** URL search params → the query the API expects. */
export const toPeopleQuery = (search: PeopleSearch): PeopleQuery => ({
  page: search.page ?? 1,
  limit: PAGE_SIZE,
  sort: search.sort ?? DEFAULT_SORT,
  ...(search.q ? { search: search.q } : {}),
  ...(search.status ? { status: search.status } : {}),
  ...(search.community ? { community: search.community } : {}),
  ...(search.ministry ? { ministry: search.ministry } : {}),
});

/** Second line under the name: "45 р. · Львів", skipping whatever is missing. */
export const getPersonMeta = (person: Person) => {
  const age = getAge(person.birthDate);

  return [age === null ? null : `${age} р.`, person.city].filter(Boolean).join(' · ');
};
