import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, Prisma } from '@generated/prisma/client';
import {
  ActivityState,
  MinistryRole,
  PrismaService,
  StepState,
} from '@/infra/prisma/prisma.service';

import { ActivityService, type ActivityEntry, type Actor } from '@/api/activity/activity.service';

import { BulkPeopleDto } from './dto/bulk-people.dto';
import { CreatePersonDto, MinistryAssignmentDto } from './dto/create-person.dto';
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
  /// Події, внесені руками: одруження, переїзд, свідчення.
  events: {
    include: { withPerson: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { occurredAt: 'desc' },
  },
  /// Сани разом із завершеними: картка показує і теперішнє, і історію.
  churchRoles: {
    include: { roleType: true },
    orderBy: [{ until: { sort: 'asc', nulls: 'first' } }, { since: 'desc' }],
  },
  /// Лише діючі участі — завершені лишаються в базі як історія служіння.
  ministryAssignments: {
    where: { until: null },
    include: { ministry: { include: { community: { select: { id: true, name: true } } } } },
    orderBy: { ministry: { name: 'asc' } },
  },
  trainings: true,
  /// Кроки разом із завершеними: картка людини показує і план, і історію.
  steps: {
    include: { stepType: true },
    orderBy: [{ completedAt: 'desc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
  },
} as const satisfies Prisma.PersonInclude;

@Injectable()
export class PersonService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  public async create(createPersonDto: CreatePersonDto, actor: Actor): Promise<Person> {
    const person = await this.prismaService.person.create({
      data: toPersonCreateData(createPersonDto),
      include: PERSON_INCLUDE,
    });

    await this.activityService.log(
      person.id,
      [{ kind: ActivityKind.PERSON_CREATED, subject: 'person' }],
      actor,
    );

    return person;
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

  /** Dashboard totals ignore ad-hoc filters but follow inactive-person visibility. */
  public async stats(includeInactive = false): Promise<PeopleStats> {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - MONTH_MS);
    const visiblePeople = includeInactive ? {} : { activity: { not: ActivityState.INACTIVE } };
    // Крок, який мав бути зроблений до сьогодні й досі в роботі.
    const overdueStep = {
      state: { in: [StepState.PLANNED, StepState.IN_PROGRESS] },
      dueAt: { lt: new Date(now.toISOString().slice(0, 10)) },
    };

    const [total, inCommunity, newThisMonth, needsAction] = await Promise.all([
      this.prismaService.person.count({ where: visiblePeople }),
      this.prismaService.person.count({
        where: { ...visiblePeople, communities: { some: {} } },
      }),
      this.prismaService.person.count({
        where: { ...visiblePeople, createdAt: { gte: monthAgo } },
      }),
      this.prismaService.person.count({
        where: {
          ...visiblePeople,
          OR: [{ careNeeded: true }, { steps: { some: overdueStep } }],
        },
      }),
    ]);

    return { total, inCommunity, newThisMonth, needsAction };
  }

  /**
   * Тільки ідентифікатори за поточним фільтром — щоб «вибрати всіх знайдених»
   * не тягнуло сотні повних карток.
   */
  public async findIds(query: FindPeopleDto): Promise<string[]> {
    const people = await this.prismaService.person.findMany({
      where: buildPeopleWhere(query),
      select: { id: true },
    });

    return people.map(({ id }) => id);
  }

  /**
   * Одна дія над багатьма людьми: база тільки наповнюється, тож додати два десятки
   * людей у служіння списком швидше, ніж відкривати кожну картку.
   */
  public async bulk(dto: BulkPeopleDto, actor: Actor): Promise<BulkResult> {
    const result = await this.applyBulk(dto);

    await this.activityService.logMany(dto.personIds, await this.describeBulk(dto), actor);

    return result;
  }

  /** Людиночитний запис у журнал: назва служіння, а не її ідентифікатор. */
  private async describeBulk(dto: BulkPeopleDto): Promise<ActivityEntry> {
    const mode = dto.mode ?? 'add';
    const kind = mode === 'add' ? ActivityKind.RELATION_ADDED : ActivityKind.RELATION_REMOVED;
    const target = dto.targetId ? await this.nameOfTarget(dto.action, dto.targetId) : null;

    switch (dto.action) {
      case 'membership':
      case 'activity':
        return { kind: ActivityKind.FIELD_CHANGED, subject: dto.action, newValue: dto[dto.action] };

      case 'careNeeded':
        return {
          kind: ActivityKind.FIELD_CHANGED,
          subject: 'careNeeded',
          newValue: String(dto.careNeeded),
        };

      case 'step':
        return { kind: ActivityKind.STEP_ADDED, subject: 'step', target };

      case 'churchRole':
        return {
          kind: mode === 'add' ? ActivityKind.ROLE_ASSIGNED : ActivityKind.ROLE_REMOVED,
          subject: 'churchRole',
          target,
        };

      default:
        return { kind, subject: dto.action, target };
    }
  }

  private async nameOfTarget(action: BulkPeopleDto['action'], id: string): Promise<string | null> {
    const found = await (action === 'ministry'
      ? this.prismaService.ministry.findUnique({ where: { id }, select: { name: true } })
      : action === 'community'
        ? this.prismaService.community.findUnique({ where: { id }, select: { name: true } })
        : action === 'training'
          ? this.prismaService.training.findUnique({ where: { id }, select: { name: true } })
          : action === 'homeGroup'
            ? this.prismaService.homeGroup.findUnique({ where: { id }, select: { name: true } })
            : action === 'step'
              ? this.prismaService.stepType.findUnique({ where: { id }, select: { name: true } })
              : action === 'churchRole'
                ? this.prismaService.churchRoleType.findUnique({
                    where: { id },
                    select: { name: true },
                  })
                : null);

    return found?.name ?? null;
  }

  private async applyBulk(dto: BulkPeopleDto): Promise<BulkResult> {
    const personIds = dto.personIds;
    const mode = dto.mode ?? 'add';

    switch (dto.action) {
      case 'ministry':
        return this.bulkMinistry(
          personIds,
          requireTarget(dto),
          dto.role ?? MinistryRole.MEMBER,
          mode,
        );

      case 'community':
        return this.bulkRelation('community', personIds, requireTarget(dto), mode);

      case 'training':
        return this.bulkRelation('training', personIds, requireTarget(dto), mode);

      case 'homeGroup': {
        // Порожня ціль означає «прибрати з групи».
        const homeGroupId = mode === 'remove' ? null : (dto.targetId ?? null);
        const { count } = await this.prismaService.person.updateMany({
          where: { id: { in: personIds } },
          data: { homeGroupId },
        });

        return { affected: count };
      }

      case 'step':
        return this.bulkStep(personIds, requireTarget(dto), dto.dueAt, dto.responsible);

      case 'churchRole':
        return this.bulkChurchRole(personIds, requireTarget(dto), mode);

      case 'membership':
      case 'activity':
      case 'careNeeded': {
        const value = dto[dto.action];

        if (value === undefined) {
          throw new BadRequestException(`Поле "${dto.action}" обовʼязкове для цієї дії`);
        }

        const { count } = await this.prismaService.person.updateMany({
          where: { id: { in: personIds } },
          data: { [dto.action]: value },
        });

        return { affected: count };
      }
    }
  }

  /** Роль у служінні: наявним учасникам оновлюємо роль, відсутніх додаємо. */
  private async bulkMinistry(
    personIds: string[],
    ministryId: string,
    role: MinistryRole,
    mode: 'add' | 'remove',
  ): Promise<BulkResult> {
    if (mode === 'remove') {
      const { count } = await this.prismaService.ministryAssignment.deleteMany({
        where: { personId: { in: personIds }, ministryId, until: null },
      });

      return { affected: count };
    }

    const existing = await this.prismaService.ministryAssignment.findMany({
      where: { personId: { in: personIds }, ministryId, until: null },
      select: { personId: true },
    });
    const existingIds = new Set(existing.map(({ personId }) => personId));
    const missing = personIds.filter((id) => !existingIds.has(id));

    const [, created] = await this.prismaService.$transaction([
      this.prismaService.ministryAssignment.updateMany({
        where: { personId: { in: personIds }, ministryId, until: null },
        data: { role },
      }),
      this.prismaService.ministryAssignment.createMany({
        data: missing.map((personId) => ({ personId, ministryId, role })),
      }),
    ]);

    return { affected: existingIds.size + created.count };
  }

  /** Сан не дублюємо: у кого він уже діючий, той лишається як був. */
  private async bulkChurchRole(
    personIds: string[],
    roleTypeId: string,
    mode: 'add' | 'remove',
  ): Promise<BulkResult> {
    if (mode === 'remove') {
      const { count } = await this.prismaService.churchRole.deleteMany({
        where: { personId: { in: personIds }, roleTypeId, until: null },
      });

      return { affected: count };
    }

    const existing = await this.prismaService.churchRole.findMany({
      where: { personId: { in: personIds }, roleTypeId, until: null },
      select: { personId: true },
    });
    const existingIds = new Set(existing.map(({ personId }) => personId));

    const { count } = await this.prismaService.churchRole.createMany({
      data: personIds
        .filter((id) => !existingIds.has(id))
        .map((personId) => ({ personId, roleTypeId })),
    });

    return { affected: count };
  }

  /** Спільноти й навчання — звичайні звʼязки, тож приєднуємо всіх одним запитом. */
  private async bulkRelation(
    relation: 'community' | 'training',
    personIds: string[],
    targetId: string,
    mode: 'add' | 'remove',
  ): Promise<BulkResult> {
    const people = personIds.map((id) => ({ id }));
    const data = { people: mode === 'add' ? { connect: people } : { disconnect: people } };

    await (relation === 'community'
      ? this.prismaService.community.update({ where: { id: targetId }, data })
      : this.prismaService.training.update({ where: { id: targetId }, data }));

    return { affected: personIds.length };
  }

  /** Крок не дублюємо: у кого він уже в роботі, той лишається як був. */
  private async bulkStep(
    personIds: string[],
    stepTypeId: string,
    dueAt?: string,
    responsible?: string,
  ): Promise<BulkResult> {
    const existing = await this.prismaService.personStep.findMany({
      where: {
        personId: { in: personIds },
        stepTypeId,
        state: { in: [StepState.PLANNED, StepState.IN_PROGRESS] },
      },
      select: { personId: true },
    });
    const existingIds = new Set(existing.map(({ personId }) => personId));

    const { count } = await this.prismaService.personStep.createMany({
      data: personIds
        .filter((id) => !existingIds.has(id))
        .map((personId) => ({
          personId,
          stepTypeId,
          ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
          ...(responsible ? { responsible } : {}),
        })),
    });

    return { affected: count };
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

  public async update(id: string, updatePersonDto: UpdatePersonDto, actor: Actor): Promise<Person> {
    const before = await this.findOne(id);

    const { ministries, ...personDto } = updatePersonDto;

    await this.prismaService.person.update({ where: { id }, data: toPersonData(personDto) });

    if (ministries !== undefined) await this.syncMinistryAssignments(id, ministries ?? []);

    const after = await this.findOne(id);

    await this.activityService.log(id, diffPeople(before, after), actor);

    return after;
  }

  /**
   * Приводить діючі участі людини до надісланого набору: зайві прибирає, ролі
   * оновлює, нові створює. Роль, яку не змінювали, лишається як була.
   */
  private async syncMinistryAssignments(
    personId: string,
    desired: MinistryAssignmentDto[],
  ): Promise<void> {
    const current = await this.prismaService.ministryAssignment.findMany({
      where: { personId, until: null },
      select: { id: true, ministryId: true, role: true },
    });

    const kept = new Set(desired.map(({ ministryId }) => ministryId));
    const removed = current.filter(({ ministryId }) => !kept.has(ministryId));
    const added = desired.filter(
      ({ ministryId }) => !current.some((assignment) => assignment.ministryId === ministryId),
    );
    const changed = desired.filter(({ ministryId, role }) =>
      current.some(
        (assignment) => assignment.ministryId === ministryId && assignment.role !== role,
      ),
    );

    if (removed.length === 0 && added.length === 0 && changed.length === 0) return;

    await this.prismaService.$transaction([
      ...(removed.length === 0
        ? []
        : [
            this.prismaService.ministryAssignment.deleteMany({
              where: { id: { in: removed.map(({ id }) => id) } },
            }),
          ]),
      ...changed.map(({ ministryId, role }) =>
        this.prismaService.ministryAssignment.updateMany({
          where: { personId, ministryId, until: null },
          data: { role },
        }),
      ),
      ...(added.length === 0
        ? []
        : [
            this.prismaService.ministryAssignment.createMany({
              data: added.map(({ ministryId, role }) => ({ personId, ministryId, role })),
            }),
          ]),
    ]);
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

const toPersonData = <T extends PersonInput>({
  communityIds,
  homeGroupId,
  trainingIds,
  ...personDto
}: T) => ({
  ...toPersonFields(personDto),
  ...(communityIds === undefined
    ? {}
    : { communities: { set: (communityIds ?? []).map((id) => ({ id })) } }),
  ...(homeGroupId === undefined ? {} : { homeGroupId }),
  ...(trainingIds === undefined
    ? {}
    : { trainings: { set: (trainingIds ?? []).map((id) => ({ id })) } }),
});

const toPersonFields = <T extends PersonInput>({
  birthDate,
  firstVisitAt,
  lastSeenAt,
  baptizedAt,
  memberSince,
  leftAt,
  ...rest
}: T) => ({
  ...rest,
  ...(birthDate === undefined ? {} : { birthDate: toDate(birthDate) }),
  ...(firstVisitAt === undefined ? {} : { firstVisitAt: toDate(firstVisitAt) }),
  ...(lastSeenAt === undefined ? {} : { lastSeenAt: toDate(lastSeenAt) }),
  ...(baptizedAt === undefined ? {} : { baptizedAt: toDate(baptizedAt) }),
  ...(memberSince === undefined ? {} : { memberSince: toDate(memberSince) }),
  ...(leftAt === undefined ? {} : { leftAt: toDate(leftAt) }),
});

export { toPersonData };

const toPersonCreateData = (createPersonDto: CreatePersonDto) => {
  const { communityIds, homeGroupId, ministries, trainingIds, ...personDto } = createPersonDto;

  return {
    ...toPersonFields(personDto),
    ...(communityIds === undefined
      ? {}
      : { communities: { connect: (communityIds ?? []).map((id) => ({ id })) } }),
    ...(homeGroupId === undefined ? {} : { homeGroupId }),
    ...(ministries === undefined
      ? {}
      : {
          ministryAssignments: {
            create: ministries.map(({ ministryId, role }) => ({ ministryId, role })),
          },
        }),
    ...(trainingIds === undefined
      ? {}
      : { trainings: { connect: (trainingIds ?? []).map((id) => ({ id })) } }),
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

export type PersonChoice = { id: string; firstName: string; lastName: string | null };

/** Поля, зміну яких варто бачити в журналі. Службові (updatedAt) пропускаємо. */
const TRACKED_FIELDS = [
  'firstName',
  'lastName',
  'gender',
  'membership',
  'activity',
  'careNeeded',
  'followUp',
  'phone',
  'homePhone',
  'workPhone',
  'email',
  'city',
  'address',
  'postalCode',
  'district',
  'region',
  'birthDate',
  'baptizedAt',
  'memberSince',
  'leftAt',
  'firstVisitAt',
  'lastSeenAt',
  'connectedBy',
  'responsible',
  'notes',
] as const satisfies readonly (keyof Person)[];

/**
 * Різниця між станом до і після збереження. Звʼязки порівнюються за назвами,
 * бо ідентифікатор у журналі нічого не каже тому, хто його читає.
 */
export const diffPeople = (before: Person, after: Person): ActivityEntry[] => [
  ...TRACKED_FIELDS.flatMap((field) => {
    const oldValue = toText(before[field]);
    const newValue = toText(after[field]);

    return oldValue === newValue
      ? []
      : [{ kind: ActivityKind.FIELD_CHANGED, subject: field, oldValue, newValue }];
  }),
  ...diffRelation(
    'community',
    before.communities.map(({ name }) => name),
    after.communities.map(({ name }) => name),
  ),
  ...diffRelation(
    'training',
    before.trainings.map(({ name }) => name),
    after.trainings.map(({ name }) => name),
  ),
  ...diffRelation(
    'homeGroup',
    before.homeGroup ? [before.homeGroup.name] : [],
    after.homeGroup ? [after.homeGroup.name] : [],
  ),
  ...diffMinistries(before, after),
];

const diffRelation = (subject: string, before: string[], after: string[]): ActivityEntry[] => [
  ...after
    .filter((name) => !before.includes(name))
    .map((name) => ({ kind: ActivityKind.RELATION_ADDED, subject, target: name })),
  ...before
    .filter((name) => !after.includes(name))
    .map((name) => ({ kind: ActivityKind.RELATION_REMOVED, subject, target: name })),
];

/** Служіння порівнюємо разом із роллю: зміна ролі — теж подія. */
const diffMinistries = (before: Person, after: Person): ActivityEntry[] => {
  const describe = ({ ministry, role }: Person['ministryAssignments'][number]) =>
    ({ name: ministry.name, role }) as const;
  const was = before.ministryAssignments.map(describe);
  const now = after.ministryAssignments.map(describe);

  return [
    ...now
      .filter(({ name }) => !was.some((item) => item.name === name))
      .map(({ name, role }) => ({
        kind: ActivityKind.RELATION_ADDED,
        subject: 'ministry',
        target: name,
        newValue: role,
      })),
    ...was
      .filter(({ name }) => !now.some((item) => item.name === name))
      .map(({ name }) => ({
        kind: ActivityKind.RELATION_REMOVED,
        subject: 'ministry',
        target: name,
      })),
    ...now.flatMap(({ name, role }) => {
      const previous = was.find((item) => item.name === name);

      return previous && previous.role !== role
        ? [
            {
              kind: ActivityKind.FIELD_CHANGED,
              subject: 'ministryRole',
              target: name,
              oldValue: previous.role,
              newValue: role,
            },
          ]
        : [];
    }),
  ];
};

/** У журнал пишемо лише прості значення: звʼязки порівнюються окремо, за назвами. */
const toText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return null;
};

export type BulkResult = {
  /** Скільки людей дія реально зачепила. */
  affected: number;
};

const requireTarget = ({ action, targetId }: BulkPeopleDto): string => {
  if (!targetId) throw new BadRequestException(`Оберіть, що саме додати (дія "${action}")`);

  return targetId;
};

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
  gender: 'gender',
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
  responsible: 'responsible',
  firstVisitAt: 'firstVisitAt',
  baptizedAt: 'baptizedAt',
  memberSince: 'memberSince',
  leftAt: 'leftAt',
  notes: 'notes',
} as const satisfies Partial<Record<PeopleSort, keyof Prisma.PersonOrderByWithRelationInput>>;

const REQUIRED_SORT_COLUMNS = {
  membership: 'membership',
  activity: 'activity',
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
  {
    search,
    minAge,
    maxAge,
    communityId,
    homeGroupId,
    ministryId,
    trainingId,
    filter,
    includeInactive,
  }: FindPeopleDto,
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
    // Неактивні приховані, поки їх не попросять явно.
    ...(includeInactive ? {} : { activity: { not: ActivityState.INACTIVE } }),
    ...toAgeWhere(minAge, maxAge, now),
    ...(communityId === undefined ? {} : { communities: { some: { id: communityId } } }),
    ...(homeGroupId === undefined ? {} : { homeGroupId }),
    ...(ministryId === undefined
      ? {}
      : { ministryAssignments: { some: { ministryId, until: null } } }),
    ...(trainingId === undefined ? {} : { trainings: { some: { id: trainingId } } }),
    ...(clauses.length === 0 ? {} : { AND: clauses }),
  };
};
