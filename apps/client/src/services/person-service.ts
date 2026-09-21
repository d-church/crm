import { RestService } from './abstracts/rest-service';
import type { Community } from './community-service';
import type { HomeGroup } from './home-group-service';
import type { Ministry } from './ministry-service';
import type { Training } from './training-service';

/** Mirrors the API's sortable columns. */
export const PEOPLE_SORTS = [
  'name',
  'gender',
  'status',
  'homeGroup',
  'lastSeenAt',
  'phone',
  'email',
  'city',
  'address',
  'district',
  'region',
  'age',
  'birthDate',
  'birthday',
  'followUp',
  'connectedBy',
  'nextStep',
  'responsible',
  'nextAction',
  'nextActionAt',
  'firstVisitAt',
  'baptizedAt',
  'memberSince',
  'leftAt',
  'createdAt',
  'notes',
] as const;

export type PeopleSort = (typeof PEOPLE_SORTS)[number];

export type SortOrder = 'asc' | 'desc';

/**
 * Mirrors the API's people filter (`apps/api/src/api/person/filter/people-filter.ts`):
 * a flat list of conditions where all must match, or any one is enough.
 */
export type PeopleFilter = {
  match: 'all' | 'any';
  conditions: PeopleFilterCondition[];
};

export type PeopleFilterCondition = {
  field: PeopleFilterField;
  operator: PeopleFilterOperator;
  /** Omitted for `isEmpty` / `isNotEmpty`; the API checks the shape per field. */
  value?: string | number | string[] | number[];
};

export type PeopleFilterField =
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'phone'
  | 'email'
  | 'city'
  | 'address'
  | 'district'
  | 'region'
  | 'connectedBy'
  | 'nextStep'
  | 'responsible'
  | 'nextAction'
  | 'notes'
  | 'status'
  | 'followUp'
  | 'ministries'
  | 'trainings'
  | 'communities'
  | 'homeGroup'
  | 'firstVisitAt'
  | 'lastSeenAt'
  | 'nextActionAt'
  | 'birthDate'
  | 'birthday'
  | 'baptizedAt'
  | 'memberSince'
  | 'leftAt'
  | 'createdAt'
  | 'age';

export type PeopleFilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'notIn'
  | 'inMonths'
  | 'on'
  | 'before'
  | 'after'
  | 'between'
  | 'withinLastDays'
  | 'moreThanDaysAgo'
  | 'withinNextDays'
  | 'atLeast'
  | 'atMost'
  | 'isEmpty'
  | 'isNotEmpty';

/** Mirrors the API's FindPeopleDto — every field is optional. */
export type PeopleQuery = {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  status?: PersonStatus;
  minAge?: number;
  maxAge?: number;
  communityId?: string;
  homeGroupId?: string;
  ministryId?: string;
  trainingId?: string;
  filter?: PeopleFilter;
  sort?: PeopleSort;
  order?: SortOrder;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type PeopleStats = {
  total: number;
  inCommunity: number;
  newThisMonth: number;
  needsAction: number;
};

export type PersonChoice = { id: string; firstName: string; lastName: string | null };

/** The API caps a page at 200; the CSV export pages through instead of asking for more. */
export const MAX_PAGE_SIZE = 200;

class PersonServiceClass extends RestService<Person> {
  protected anchor = 'people';

  public async list({ filter, ...query }: PeopleQuery = {}): Promise<Paginated<Person>> {
    const response = await this.api.get<Paginated<Person>>(this.anchor, {
      // Axios would flatten a nested object into `filter[conditions][0]…`; the API reads JSON.
      params: { ...query, ...(filter ? { filter: JSON.stringify(filter) } : {}) },
    });

    return response.data;
  }

  public async stats(includeInactive = false): Promise<PeopleStats> {
    const response = await this.api.get<PeopleStats>(`${this.anchor}/stats`, {
      params: includeInactive ? { includeInactive: true } : undefined,
    });

    return response.data;
  }

  public async choices(): Promise<PersonChoice[]> {
    const response = await this.api.get<PersonChoice[]>(`${this.anchor}/choices`);

    return response.data;
  }

  /**
   * Every row matching the filters, for the CSV export. Pages through rather than
   * asking for one huge response, so a growing base never silently truncates.
   */
  public async listAll(query: PeopleQuery = {}): Promise<Person[]> {
    const items: Person[] = [];
    let page = 1;

    for (;;) {
      const chunk = await this.list({ ...query, page, limit: MAX_PAGE_SIZE });

      items.push(...chunk.items);

      if (page >= chunk.pages || chunk.items.length === 0) return items;

      page += 1;
    }
  }
}

export const PersonStatus = {
  NEW: 'NEW',
  CONNECTED: 'CONNECTED',
  NEXT_STEP: 'NEXT_STEP',
  COMMUNITY: 'COMMUNITY',
  SERVING: 'SERVING',
  CARE: 'CARE',
  ABROAD: 'ABROAD',
  INACTIVE: 'INACTIVE',
} as const;

export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];

export const FollowUpState = {
  NOT_DONE: 'NOT_DONE',
  PLANNED: 'PLANNED',
  DONE: 'DONE',
} as const;

export type FollowUpState = (typeof FollowUpState)[keyof typeof FollowUpState];

export const PersonGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type PersonGender = (typeof PersonGender)[keyof typeof PersonGender];

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: PersonGender | null;
  email: string | null;
  phone: string | null;
  homePhone: string | null;
  workPhone: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  district: string | null;
  region: string | null;
  status: PersonStatus;
  firstVisitAt: string | null;
  lastSeenAt: string | null;
  connectedBy: string | null;
  followUp: FollowUpState;
  nextStep: string | null;
  communities: Pick<Community, 'id' | 'name'>[];
  homeGroup: Pick<HomeGroup, 'id' | 'name'> | null;
  ministries: (Pick<Ministry, 'id' | 'name'> & {
    community: Pick<Community, 'id' | 'name'> | null;
  })[];
  trainings: Pick<Training, 'id' | 'name'>[];
  responsible: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  birthDate: string | null;
  baptizedAt: string | null;
  memberSince: string | null;
  leftAt: string | null;
  /** Код_ЧлениЦеркви зі старої бази Access, якщо людина прийшла звідти. */
  legacyId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getPersonName = ({ firstName, lastName }: Pick<Person, 'firstName' | 'lastName'>) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PersonService = new PersonServiceClass();
