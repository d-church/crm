import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService, PersonStatus } from '@/infra/prisma/prisma.service';

import { CreatePersonDto } from './dto/create-person.dto';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  DEFAULT_SORT_ORDER,
  FindPeopleDto,
  type PeopleSort,
  type SortOrder,
} from './dto/find-people.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { buildPeopleFilterWhere, toAgeWhere } from './filter/people-filter';

const PERSON_INCLUDE = {
  communities: true,
  homeGroup: { select: { id: true, name: true } },
} as const satisfies Prisma.PersonInclude;

@Injectable()
export class PersonService {
  constructor(private readonly prismaService: PrismaService) {}

  public async create(createPersonDto: CreatePersonDto): Promise<Person> {
    return this.prismaService.person.create({
      data: toPersonCreateData(createPersonDto),
      include: PERSON_INCLUDE,
    });
  }

  public async findAll(query: FindPeopleDto): Promise<PaginatedPeople> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const where = buildPeopleWhere(query);

    const [items, total] = await Promise.all([
      this.prismaService.person.findMany({
        where,
        // The id tiebreaker keeps rows from shuffling between pages when the
        // sort column ties — otherwise the same person can appear on two pages.
        orderBy: [...buildPeopleOrderBy(query.sort, query.order), { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: PERSON_INCLUDE,
      }),
      this.prismaService.person.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  /** Dashboard totals for the whole base — deliberately ignores the filters. */
  public async stats(): Promise<PeopleStats> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - MONTH_MS);

    const [total, inCommunity, newThisMonth, needsAction] = await Promise.all([
      this.prismaService.person.count(),
      this.prismaService.person.count({
        where: { communities: { some: {} } },
      }),
      this.prismaService.person.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prismaService.person.count({
        where: { OR: [{ status: PersonStatus.CARE }, { nextActionAt: { lte: now } }] },
      }),
    ]);

    return { total, inCommunity, newThisMonth, needsAction };
  }

  /** Distinct values behind the ministry dropdown. */
  public async options(): Promise<PeopleOptions> {
    const ministries = await this.prismaService.person.groupBy({ by: ['ministry'] });

    return {
      ministries: toSortedValues(ministries.map(({ ministry }) => ministry)),
    };
  }

  /** Small relation-picker payload — avoids loading full person cards for a select. */
  public async choices(): Promise<PersonChoice[]> {
    return this.prismaService.person.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: { sort: 'asc', nulls: 'last' } }, { firstName: 'asc' }],
    });
  }

  public async findOne(id: string): Promise<Person> {
    const person = await this.prismaService.person.findUnique({
      where: { id },
      include: PERSON_INCLUDE,
    });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  public async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    await this.findOne(id);

    return this.prismaService.person.update({
      where: { id },
      data: toPersonData(updatePersonDto),
      include: PERSON_INCLUDE,
    });
  }

  public async remove(id: string): Promise<Person> {
    await this.findOne(id);

    return this.prismaService.person.delete({ where: { id }, include: PERSON_INCLUDE });
  }
}

/**
 * `@IsOptional()` lets an explicit `null` through, and that is how a PATCH clears
 * a column — so the service has to expect nulls even though the DTO types do not.
 */
type PersonInput = { [K in keyof UpdatePersonDto]?: UpdatePersonDto[K] | null };

/**
 * Dates arrive as ISO strings; Prisma wants `Date`. An explicit `null` has to pass
 * through untouched — `new Date(null)` would quietly store 1970-01-01 instead of
 * clearing the column.
 */
const toDate = (value: string | null) => (value === null ? null : new Date(value));

const toPersonData = <T extends PersonInput>({ communityIds, homeGroupId, ...personDto }: T) => ({
  ...toPersonFields(personDto),
  ...(communityIds === undefined
    ? {}
    : { communities: { set: (communityIds ?? []).map((id) => ({ id })) } }),
  ...(homeGroupId === undefined ? {} : { homeGroupId }),
});

const toPersonFields = <T extends PersonInput>({
  birthDate,
  firstVisitAt,
  lastSeenAt,
  nextActionAt,
  baptizedAt,
  memberSince,
  leftAt,
  ...rest
}: T) => ({
  ...rest,
  ...(birthDate === undefined ? {} : { birthDate: toDate(birthDate) }),
  ...(firstVisitAt === undefined ? {} : { firstVisitAt: toDate(firstVisitAt) }),
  ...(lastSeenAt === undefined ? {} : { lastSeenAt: toDate(lastSeenAt) }),
  ...(nextActionAt === undefined ? {} : { nextActionAt: toDate(nextActionAt) }),
  ...(baptizedAt === undefined ? {} : { baptizedAt: toDate(baptizedAt) }),
  ...(memberSince === undefined ? {} : { memberSince: toDate(memberSince) }),
  ...(leftAt === undefined ? {} : { leftAt: toDate(leftAt) }),
});

export { toPersonData };

const toPersonCreateData = (createPersonDto: CreatePersonDto) => {
  const { communityIds, homeGroupId, ...personDto } = createPersonDto;

  return {
    ...toPersonFields(personDto),
    ...(communityIds === undefined
      ? {}
      : { communities: { connect: (communityIds ?? []).map((id) => ({ id })) } }),
    ...(homeGroupId === undefined ? {} : { homeGroupId }),
  };
};

export type Person = Prisma.PersonGetPayload<{ include: typeof PERSON_INCLUDE }>;

export type PaginatedPeople = {
  items: Person[];
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

export type PeopleOptions = { ministries: string[] };

export type PersonChoice = { id: string; firstName: string; lastName: string | null };

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Fields the free-text search looks at, in the order a person would guess. */
const SEARCH_FIELDS = [
  'firstName',
  'lastName',
  'phone',
  'homePhone',
  'workPhone',
  'email',
  'city',
] as const satisfies readonly (keyof Person)[];

/**
 * Columns that can be null sort their blanks last in both directions, so a list
 * never opens with a page of dashes.
 */
const NULLABLE_SORT_COLUMNS = {
  ministry: 'ministry',
  lastSeenAt: 'lastSeenAt',
  phone: 'phone',
  email: 'email',
  city: 'city',
  address: 'address',
  district: 'district',
  region: 'region',
  birthDate: 'birthDate',
  birthday: 'birthMd',
  connectedBy: 'connectedBy',
  nextStep: 'nextStep',
  responsible: 'responsible',
  nextAction: 'nextAction',
  nextActionAt: 'nextActionAt',
  firstVisitAt: 'firstVisitAt',
  baptizedAt: 'baptizedAt',
  memberSince: 'memberSince',
  leftAt: 'leftAt',
  notes: 'notes',
} as const satisfies Partial<Record<PeopleSort, keyof Prisma.PersonOrderByWithRelationInput>>;

const REQUIRED_SORT_COLUMNS = {
  status: 'status',
  followUp: 'followUp',
  createdAt: 'createdAt',
} as const satisfies Partial<Record<PeopleSort, keyof Prisma.PersonOrderByWithRelationInput>>;

/**
 * Text sorts alphabetically and numbers and dates from smallest to largest — both
 * are just the column's own order. Age is the exception: the older a person is,
 * the earlier they were born, so it sorts the birth date the other way round.
 */
export const buildPeopleOrderBy = (
  sort: PeopleSort = DEFAULT_SORT,
  order: SortOrder = sort === DEFAULT_SORT ? DEFAULT_SORT_ORDER : 'asc',
): Prisma.PersonOrderByWithRelationInput[] => {
  if (sort === 'name') {
    return [{ lastName: { sort: order, nulls: 'last' } }, { firstName: order }];
  }

  if (sort === 'homeGroup') {
    return [{ homeGroup: { name: order } }];
  }

  if (sort === 'age') {
    return [{ birthDate: { sort: order === 'asc' ? 'desc' : 'asc', nulls: 'last' } }];
  }

  if (sort in REQUIRED_SORT_COLUMNS) {
    return [{ [REQUIRED_SORT_COLUMNS[sort as keyof typeof REQUIRED_SORT_COLUMNS]]: order }];
  }

  const column = NULLABLE_SORT_COLUMNS[sort as keyof typeof NULLABLE_SORT_COLUMNS];

  return [{ [column]: { sort: order, nulls: 'last' } }];
};

/**
 * Every search term has to match some field, so "Іван Петренко" finds the person
 * even though no single column holds the full name.
 *
 * The condition filter goes into `AND` next to the terms rather than being spread
 * in, so it can never overwrite a key the simple filters set (both may touch
 * `birthDate`, for one).
 */
export const buildPeopleWhere = (
  { search, status, minAge, maxAge, communityId, homeGroupId, ministry, filter }: FindPeopleDto,
  now = new Date(),
): Prisma.PersonWhereInput => {
  const terms = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  const clauses: Prisma.PersonWhereInput[] = [
    ...terms.map((term) => ({
      OR: SEARCH_FIELDS.map((field) => ({
        [field]: { contains: term, mode: 'insensitive' as const },
      })),
    })),
    ...(filter === undefined ? [] : [buildPeopleFilterWhere(filter, now)]),
  ];

  return {
    ...(status === undefined ? {} : { status }),
    ...toAgeWhere(minAge, maxAge, now),
    ...(communityId === undefined ? {} : { communities: { some: { id: communityId } } }),
    ...(homeGroupId === undefined ? {} : { homeGroupId }),
    ...(ministry === undefined ? {} : { ministry }),
    ...(clauses.length === 0 ? {} : { AND: clauses }),
  };
};

const toSortedValues = (values: (string | null)[]): string[] =>
  values
    .filter((value): value is string => Boolean(value?.trim()))
    .sort((a, b) => a.localeCompare(b, 'uk'));
