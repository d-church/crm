import { z } from 'zod';

import { getAge } from '@/lib/format';
import {
  PEOPLE_SORTS,
  type PeopleFilter,
  type PeopleFilterField,
  type PeopleFilterOperator,
  type PeopleQuery,
  type PeopleSort,
  type Person,
  type SortOrder,
} from '@/services';

import { FILTER_FIELDS, getOperators, MAX_FILTER_CONDITIONS } from './filter-fields';

export const PAGE_SIZE = 25;

export const DEFAULT_SORT: PeopleSort = 'createdAt';
/** Newest additions first — what the default view means. */
export const DEFAULT_SORT_ORDER: SortOrder = 'desc';

const FILTER_FIELD_NAMES = FILTER_FIELDS.map(({ field }) => field) as [
  PeopleFilterField,
  ...PeopleFilterField[],
];

/**
 * Only the shape is checked here — the API validates values per field. A field or
 * operator this client does not know about fails the whole filter, which is then
 * dropped rather than sent.
 */
export const peopleFilterSchema = z.preprocess(
  // Normally the router hands over the parsed object; a hand-typed URL may not.
  (value) => {
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  },
  z.object({
    match: z.enum(['all', 'any']),
    conditions: z
      .array(
        z
          .object({
            field: z.enum(FILTER_FIELD_NAMES),
            operator: z.string(),
            value: z
              .union([z.string(), z.number(), z.array(z.string()), z.array(z.number())])
              .optional(),
          })
          .refine(({ field, operator }) =>
            getOperators(field).includes(operator as PeopleFilterOperator),
          ),
      )
      .min(1)
      .max(MAX_FILTER_CONDITIONS),
  }),
) as z.ZodType<PeopleFilter | undefined>;

/**
 * Filters live in the URL, so a filtered list can be shared, bookmarked and
 * walked with the back button. Everything is optional — defaults stay out of the
 * URL instead of cluttering it.
 */
export const peopleSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  // A broken filter is dropped on its own instead of resetting the search and page.
  filter: peopleFilterSchema.optional().catch(undefined),
  sort: z.enum([...PEOPLE_SORTS]).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export type PeopleSearch = z.infer<typeof peopleSearchSchema>;

/** Detail pages list the members of one community or home group with the same table. */
type PeopleQueryInput = PeopleSearch &
  Pick<PeopleQuery, 'communityId' | 'homeGroupId' | 'ministryId' | 'trainingId'>;

/** URL search params → the query the API expects. */
export const toPeopleQuery = (search: PeopleQueryInput): PeopleQuery => ({
  page: search.page ?? 1,
  limit: PAGE_SIZE,
  sort: search.sort ?? DEFAULT_SORT,
  order: search.order ?? (search.sort && search.sort !== DEFAULT_SORT ? 'asc' : DEFAULT_SORT_ORDER),
  ...(search.q ? { search: search.q } : {}),
  ...(search.filter ? { filter: search.filter } : {}),
  ...(search.communityId ? { communityId: search.communityId } : {}),
  ...(search.homeGroupId ? { homeGroupId: search.homeGroupId } : {}),
  ...(search.ministryId ? { ministryId: search.ministryId } : {}),
  ...(search.trainingId ? { trainingId: search.trainingId } : {}),
});

/** Second line under the name: "45 р. · Львів", skipping whatever is missing. */
export const getPersonMeta = (person: Person) => {
  const age = getAge(person.birthDate);

  return [age === null ? null : `${age} р.`, person.city].filter(Boolean).join(' · ');
};
