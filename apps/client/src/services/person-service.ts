import { RestService } from './abstracts/rest-service';

export const PEOPLE_SORTS = ['createdAt', 'lastSeenAt', 'name', 'status'] as const;

export type PeopleSort = (typeof PEOPLE_SORTS)[number];

/** Mirrors the API's FindPeopleDto — every field is optional. */
export type PeopleQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: PersonStatus;
  community?: string;
  ministry?: string;
  sort?: PeopleSort;
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

export type PeopleOptions = { communities: string[]; ministries: string[] };

/** The API caps a page at 200; the CSV export pages through instead of asking for more. */
export const MAX_PAGE_SIZE = 200;

class PersonServiceClass extends RestService<Person> {
  protected anchor = 'people';

  public async list(query: PeopleQuery = {}): Promise<Paginated<Person>> {
    const response = await this.api.get<Paginated<Person>>(this.anchor, { params: query });

    return response.data;
  }

  public async stats(): Promise<PeopleStats> {
    const response = await this.api.get<PeopleStats>(`${this.anchor}/stats`);

    return response.data;
  }

  public async options(): Promise<PeopleOptions> {
    const response = await this.api.get<PeopleOptions>(`${this.anchor}/options`);

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
  INACTIVE: 'INACTIVE',
} as const;

export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];

export const FollowUpState = {
  NOT_DONE: 'NOT_DONE',
  PLANNED: 'PLANNED',
  DONE: 'DONE',
} as const;

export type FollowUpState = (typeof FollowUpState)[keyof typeof FollowUpState];

export interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
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
  community: string | null;
  ministry: string | null;
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

export const getPersonName = ({ firstName, lastName }: Person) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PersonService = new PersonServiceClass();
