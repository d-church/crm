import { RestService } from './abstracts/rest-service';
import type { ChurchRole } from './church-role-service';
import type { PersonEvent } from './person-event-service';
import type { PersonStep } from './step-service';
import type { Community } from './community-service';
import type { HomeGroup } from './home-group-service';
import type { Ministry } from './ministry-service';
import type { Training } from './training-service';

/** Mirrors the API's sortable columns. */
export const PEOPLE_SORTS = [
  'name',
  'gender',
  'membership',
  'activity',
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
  'responsible',
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
  value?: string | number | boolean | string[] | number[];
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
  | 'churchRole'
  | 'openSteps'
  | 'completedSteps'
  | 'stepOverdue'
  | 'responsible'
  | 'notes'
  | 'membership'
  | 'activity'
  | 'careNeeded'
  | 'followUp'
  | 'ministries'
  | 'ministryRole'
  | 'trainings'
  | 'communities'
  | 'homeGroup'
  | 'firstVisitAt'
  | 'lastSeenAt'
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
  | 'is'
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

/** Одна дія над багатьма людьми. Для домашньої групи `mode: 'remove'` означає «прибрати з групи». */
export type BulkPeoplePayload = {
  personIds: string[];
  action:
    | 'ministry'
    | 'community'
    | 'training'
    | 'homeGroup'
    | 'step'
    | 'churchRole'
    | 'membership'
    | 'activity'
    | 'careNeeded';
  mode?: 'add' | 'remove';
  targetId?: string | null;
  role?: MinistryRole;
  membership?: MembershipStatus;
  activity?: ActivityState;
  careNeeded?: boolean;
  dueAt?: string;
  responsible?: string;
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

  /** Тільки ідентифікатори за фільтром — для «вибрати всіх знайдених». */
  public async listIds({ filter, ...query }: PeopleQuery = {}): Promise<string[]> {
    const response = await this.api.get<string[]>(`${this.anchor}/ids`, {
      params: { ...query, ...(filter ? { filter: JSON.stringify(filter) } : {}) },
    });

    return response.data;
  }

  public async bulk(payload: BulkPeoplePayload): Promise<{ affected: number }> {
    const response = await this.api.post<{ affected: number }>(`${this.anchor}/bulk`, payload);

    return response.data;
  }

  /** Прибирає записи журналу — доступно лише суперадміну. */
  public async removeActivities(personId: string, ids: string[]): Promise<{ removed: number }> {
    const response = await this.api.delete<{ removed: number }>(
      `${this.anchor}/${personId}/activities`,
      { data: { ids } },
    );

    return response.data;
  }

  public async timeline(personId: string): Promise<TimelineItem[]> {
    const response = await this.api.get<TimelineItem[]>(`${this.anchor}/${personId}/timeline`);

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
  /**
   * Передати людину попечителю: лідер команди бачить проблему, але пасторський шар
   * йому закритий — тож він не мовчить і не лізе, а сигналить.
   */
  public async signal(id: string, note: string): Promise<void> {
    await this.api.post(`${this.anchor}/${id}/signal`, { note });
  }
}

export const MembershipStatus = {
  SUBSCRIBER: 'SUBSCRIBER',
  GUEST: 'GUEST',
  ATTENDER: 'ATTENDER',
  MEMBER: 'MEMBER',
  FORMER_MEMBER: 'FORMER_MEMBER',
} as const;

export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const ActivityState = {
  ACTIVE: 'ACTIVE',
  ABROAD: 'ABROAD',
  INACTIVE: 'INACTIVE',
  MOVED: 'MOVED',
} as const;

export type ActivityState = (typeof ActivityState)[keyof typeof ActivityState];

export const MinistryRole = {
  MEMBER: 'MEMBER',
  HELPER: 'HELPER',
  LEADER: 'LEADER',
} as const;

export type MinistryRole = (typeof MinistryRole)[keyof typeof MinistryRole];

/** Участь людини в служінні: роль належить участі, а не людині. */
export type MinistryAssignment = {
  id: string;
  ministryId: string;
  role: MinistryRole;
  since: string | null;
  until: string | null;
  ministry: Pick<Ministry, 'id' | 'name'> & {
    community: Pick<Community, 'id' | 'name'> | null;
  };
};

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
  membership: MembershipStatus;
  activity: ActivityState;
  careNeeded: boolean;
  /** Обставини пасторської уваги. Порожнє означає «не стосується». */
  orphanStatus?: OrphanStatus | null;
  isMilitary?: boolean;
  maritalStatus?: MaritalStatus | null;
  partnerId?: string | null;
  /** Пару видно з обох боків: звʼязок вносять на одній картці. */
  partner?: PersonPartner | null;
  partnerOf?: PersonPartner | null;
  maritalSince?: string | null;
  firstVisitAt: string | null;
  lastSeenAt: string | null;
  connectedBy: string | null;
  followUp: FollowUpState;
  /** Пасторський шар: без опіки над людиною сервер їх не віддає. */
  steps?: PersonStep[];
  events?: PersonEvent[];
  churchRoles: ChurchRole[];
  communities: Pick<Community, 'id' | 'name'>[];
  homeGroup: Pick<HomeGroup, 'id' | 'name'> | null;
  /** Спосіб участі в групі. Лідера тут немає — він задається в самій групі. */
  homeGroupRole?: HomeGroupRole | null;
  ministryAssignments: MinistryAssignment[];
  trainings: Pick<Training, 'id' | 'name'>[];
  /** Що людина веде — структурний шар, видно кожному, хто бачить саму людину. */
  leadingCommunities: Pick<Community, 'id' | 'name'>[];
  leadingHomeGroups: Pick<HomeGroup, 'id' | 'name'>[];
  leadingTrainings: Pick<Training, 'id' | 'name'>[];
  responsible: string | null;
  birthDate: string | null;
  baptizedAt: string | null;
  memberSince: string | null;
  leftAt: string | null;
  /** Код_ЧлениЦеркви зі старої бази Access, якщо людина прийшла звідти. */
  legacyId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Який шар картки відкритий. Без цього «немає нотаток» не відрізнити від
   * «нотатки вам закриті», і картка мовчки брехала б.
   */
  access?: PersonAccess;
}

/**
 * Пара в картці. `canOpen` каже, чи відкриється її картка: імʼя видно завжди,
 * а от доступ може бути й закритий — тоді посилання вело б у нікуди.
 */
export type PersonPartner = PersonChoice & { canOpen?: boolean };

export const HomeGroupRole = {
  HELPER: 'HELPER',
  REGULAR: 'REGULAR',
  IRREGULAR: 'IRREGULAR',
  GUEST: 'GUEST',
} as const;

export type HomeGroupRole = (typeof HomeGroupRole)[keyof typeof HomeGroupRole];

export const MaritalStatus = {
  SINGLE: 'SINGLE',
  ENGAGED: 'ENGAGED',
  MARRIED: 'MARRIED',
  DIVORCED: 'DIVORCED',
  WIDOWED: 'WIDOWED',
} as const;

export type MaritalStatus = (typeof MaritalStatus)[keyof typeof MaritalStatus];

export const OrphanStatus = {
  FULL: 'FULL',
  HALF: 'HALF',
} as const;

export type OrphanStatus = (typeof OrphanStatus)[keyof typeof OrphanStatus];

export interface PersonAccess {
  pastoral: boolean;
}

export const getPersonName = ({ firstName, lastName }: Pick<Person, 'firstName' | 'lastName'>) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PersonService = new PersonServiceClass();

/** Один пункт хронології людини. */
export type TimelineItem = {
  id: string;
  at: string;
  /** Подія життя людини чи операція з її карткою. */
  category: 'life' | 'card';
  kind: string;
  subject: string;
  target?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  actorName?: string | null;
};
