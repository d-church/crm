import { getAge } from '@/lib/format';
import { getPersonName, type Person, type PersonStatus } from '@/services';

import { PERSON_STATUSES } from './status';

export const ANY = 'ANY';

export type PeopleSort = 'lastSeen' | 'name' | 'status';

export type PeopleFilterState = {
  query: string;
  status: PersonStatus | typeof ANY;
  group: string;
  ministry: string;
  sort: PeopleSort;
};

export const DEFAULT_FILTERS: PeopleFilterState = {
  query: '',
  status: ANY,
  group: ANY,
  ministry: ANY,
  sort: 'lastSeen',
};

export const SORT_LABELS: Record<PeopleSort, string> = {
  lastSeen: 'За останньою зустріччю',
  name: 'За іменем',
  status: 'За статусом',
};

/** Second line under the name: "45 р. · Львів", skipping whatever is missing. */
export const getPersonMeta = (person: Person) => {
  const age = getAge(person.birthDate);

  return [age === null ? null : `${age} р.`, person.city].filter(Boolean).join(' · ');
};

const matchesQuery = (person: Person, query: string) => {
  const haystack = [
    getPersonName(person),
    person.phone,
    person.email,
    person.city,
    getPersonMeta(person),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
};

const byLastSeen = (a: Person, b: Person) => {
  // People never seen sink to the bottom rather than sorting as the epoch.
  const left = a.lastSeenAt ? Date.parse(a.lastSeenAt) : -Infinity;
  const right = b.lastSeenAt ? Date.parse(b.lastSeenAt) : -Infinity;

  return right - left;
};

export const filterPeople = (people: Person[], filters: PeopleFilterState): Person[] => {
  const query = filters.query.trim().toLowerCase();

  const list = people.filter(
    (person) =>
      (!query || matchesQuery(person, query)) &&
      (filters.status === ANY || person.status === filters.status) &&
      (filters.group === ANY || (person.community ?? '') === filters.group) &&
      (filters.ministry === ANY || (person.ministry ?? '') === filters.ministry),
  );

  switch (filters.sort) {
    case 'name':
      return list.sort((a, b) => getPersonName(a).localeCompare(getPersonName(b), 'uk'));
    case 'status':
      return list.sort(
        (a, b) => PERSON_STATUSES.indexOf(a.status) - PERSON_STATUSES.indexOf(b.status),
      );
    default:
      return list.sort(byLastSeen);
  }
};

/** Distinct, sorted values for the community and ministry dropdowns. */
export const collectOptions = (people: Person[], key: 'community' | 'ministry'): string[] =>
  [
    ...new Set(
      people.map((person) => person[key]).filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'uk'));
