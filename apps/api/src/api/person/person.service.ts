import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService, PersonModel, PersonStatus } from '@/infra/prisma/prisma.service';

import { CreatePersonDto } from './dto/create-person.dto';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  FindPeopleDto,
  type PeopleSort,
} from './dto/find-people.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonService {
  constructor(private readonly prismaService: PrismaService) {}

  public async create(createPersonDto: CreatePersonDto): Promise<Person> {
    return this.prismaService.person.create({
      data: toPersonData(createPersonDto),
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
        orderBy: [...SORT_ORDERS[query.sort ?? DEFAULT_SORT], { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
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
        where: { status: { in: [PersonStatus.COMMUNITY, PersonStatus.SERVING] } },
      }),
      this.prismaService.person.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prismaService.person.count({
        where: { OR: [{ status: PersonStatus.CARE }, { nextActionAt: { lte: now } }] },
      }),
    ]);

    return { total, inCommunity, newThisMonth, needsAction };
  }

  /** Distinct values behind the community and ministry dropdowns. */
  public async options(): Promise<PeopleOptions> {
    const [communities, ministries] = await Promise.all([
      this.prismaService.person.groupBy({ by: ['community'] }),
      this.prismaService.person.groupBy({ by: ['ministry'] }),
    ]);

    return {
      communities: toSortedValues(communities.map(({ community }) => community)),
      ministries: toSortedValues(ministries.map(({ ministry }) => ministry)),
    };
  }

  public async findOne(id: string): Promise<Person> {
    const person = await this.prismaService.person.findUnique({ where: { id } });
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
    });
  }

  public async remove(id: string): Promise<Person> {
    await this.findOne(id);

    return this.prismaService.person.delete({ where: { id } });
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

const toPersonData = <T extends PersonInput>({
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

export type Person = PersonModel;

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

export type PeopleOptions = { communities: string[]; ministries: string[] };

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

const SORT_ORDERS: Record<PeopleSort, Prisma.PersonOrderByWithRelationInput[]> = {
  createdAt: [{ createdAt: 'desc' }],
  // People never seen sink to the bottom instead of leading the list.
  lastSeenAt: [{ lastSeenAt: { sort: 'desc', nulls: 'last' } }],
  name: [{ lastName: 'asc' }, { firstName: 'asc' }],
  status: [{ status: 'asc' }],
};

/**
 * Every search term has to match some field, so "Іван Петренко" finds the person
 * even though no single column holds the full name.
 */
export const buildPeopleWhere = ({
  search,
  status,
  community,
  ministry,
}: FindPeopleDto): Prisma.PersonWhereInput => {
  const terms = search?.trim().split(/\s+/).filter(Boolean) ?? [];

  return {
    ...(status === undefined ? {} : { status }),
    ...(community === undefined ? {} : { community }),
    ...(ministry === undefined ? {} : { ministry }),
    ...(terms.length === 0
      ? {}
      : {
          AND: terms.map((term) => ({
            OR: SEARCH_FIELDS.map((field) => ({
              [field]: { contains: term, mode: 'insensitive' },
            })),
          })),
        }),
  };
};

const toSortedValues = (values: (string | null)[]): string[] =>
  values
    .filter((value): value is string => Boolean(value?.trim()))
    .sort((a, b) => a.localeCompare(b, 'uk'));
