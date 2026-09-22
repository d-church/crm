import { BadRequestException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import {
  ActivityState,
  FollowUpState,
  MembershipStatus,
  MinistryRole,
  PersonGender,
  StepState,
} from '@/infra/prisma/prisma.service';
import { OPEN_STEP_STATES } from '@/api/step/step.service';

/**
 * A filter is a flat list of conditions that must all match (`all`) or where one
 * is enough (`any`). No nested groups — the builder stays one screen tall.
 *
 * It travels as JSON: `?filter={"match":"all","conditions":[…]}`.
 */
export type PeopleFilter = {
  match: FilterMatch;
  conditions: PeopleFilterCondition[];
};

export type PeopleFilterCondition = {
  field: PeopleFilterField;
  operator: FilterOperator;
  value?: FilterValue;
};

export const FILTER_MATCHES = ['all', 'any'] as const;
export type FilterMatch = (typeof FILTER_MATCHES)[number];

export const MAX_FILTER_CONDITIONS = 20;

type FilterValue = string | number | boolean | string[] | number[];

/** What a field holds decides which operators make sense and what the value looks like. */
const OPERATORS = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
  enum: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  relation: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  date: [
    'on',
    'before',
    'after',
    'between',
    'withinLastDays',
    'moreThanDaysAgo',
    'withinNextDays',
    'isEmpty',
    'isNotEmpty',
  ],
  age: ['equals', 'atLeast', 'atMost', 'between', 'isEmpty', 'isNotEmpty'],
  boolean: ['is'],
  ministryRole: ['in', 'notIn'],
  step: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  overdueStep: ['is'],
  birthday: ['inMonths', 'withinNextDays', 'isEmpty', 'isNotEmpty'],
} as const;

/** A birth date is only ever asked about as a whole date, never relative to today. */
const BIRTH_DATE_OPERATORS = ['on', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'] as const;

type FieldKind = keyof typeof OPERATORS;
export type FilterOperator = (typeof OPERATORS)[FieldKind][number];

type TextColumn =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'homePhone'
  | 'workPhone'
  | 'city'
  | 'address'
  | 'district'
  | 'region'
  | 'connectedBy'
  | 'responsible'
  | 'notes';

type DateColumn =
  | 'firstVisitAt'
  | 'lastSeenAt'
  | 'birthDate'
  | 'baptizedAt'
  | 'memberSince'
  | 'leftAt'
  | 'createdAt';

type FieldDefinition =
  /** Several columns read as one field: a match in any of them counts. */
  | { kind: 'text'; columns: readonly TextColumn[] }
  | {
      kind: 'enum';
      column: 'membership' | 'activity' | 'followUp' | 'gender';
      values: readonly string[];
    }
  | { kind: 'relation'; relation: 'communities' | 'homeGroup' | 'ministries' | 'trainings' }
  | { kind: 'date'; column: DateColumn; operators?: readonly FilterOperator[] }
  | { kind: 'age' }
  /** A yes/no flag, such as "потребує уваги". */
  | { kind: 'boolean'; column: 'careNeeded' }
  /** Роль у будь-якому з діючих служінь людини. */
  | { kind: 'ministryRole' }
  /** Кроки з довідника: або ті, що в роботі, або вже завершені. */
  | { kind: 'step'; done: boolean }
  /** Чи є хоч один крок у роботі, дедлайн якого вже минув. */
  | { kind: 'overdueStep' }
  /** Day and month only — the year a person was born says nothing about their birthday. */
  | { kind: 'birthday' };

/**
 * The only fields a filter can touch. Anything else is rejected rather than
 * passed through, so a hand-written URL cannot reach columns like `legacyId`.
 */
const FIELDS = {
  firstName: { kind: 'text', columns: ['firstName'] },
  lastName: { kind: 'text', columns: ['lastName'] },
  phone: { kind: 'text', columns: ['phone', 'homePhone', 'workPhone'] },
  email: { kind: 'text', columns: ['email'] },
  city: { kind: 'text', columns: ['city'] },
  address: { kind: 'text', columns: ['address'] },
  district: { kind: 'text', columns: ['district'] },
  region: { kind: 'text', columns: ['region'] },
  connectedBy: { kind: 'text', columns: ['connectedBy'] },
  responsible: { kind: 'text', columns: ['responsible'] },
  notes: { kind: 'text', columns: ['notes'] },

  membership: { kind: 'enum', column: 'membership', values: Object.values(MembershipStatus) },
  activity: { kind: 'enum', column: 'activity', values: Object.values(ActivityState) },
  careNeeded: { kind: 'boolean', column: 'careNeeded' },
  gender: { kind: 'enum', column: 'gender', values: Object.values(PersonGender) },
  followUp: { kind: 'enum', column: 'followUp', values: Object.values(FollowUpState) },
  communities: { kind: 'relation', relation: 'communities' },
  homeGroup: { kind: 'relation', relation: 'homeGroup' },
  ministries: { kind: 'relation', relation: 'ministries' },
  ministryRole: { kind: 'ministryRole' },
  openSteps: { kind: 'step', done: false },
  completedSteps: { kind: 'step', done: true },
  stepOverdue: { kind: 'overdueStep' },
  trainings: { kind: 'relation', relation: 'trainings' },

  firstVisitAt: { kind: 'date', column: 'firstVisitAt' },
  lastSeenAt: { kind: 'date', column: 'lastSeenAt' },
  birthDate: { kind: 'date', column: 'birthDate', operators: BIRTH_DATE_OPERATORS },
  birthday: { kind: 'birthday' },
  baptizedAt: { kind: 'date', column: 'baptizedAt' },
  memberSince: { kind: 'date', column: 'memberSince' },
  leftAt: { kind: 'date', column: 'leftAt' },
  createdAt: { kind: 'date', column: 'createdAt' },

  age: { kind: 'age' },
} as const satisfies Record<string, FieldDefinition>;

export type PeopleFilterField = keyof typeof FIELDS;

/** Columns that can never be null — negations need no `OR … IS NULL` for them. */
const REQUIRED_COLUMNS: ReadonlySet<string> = new Set([
  'firstName',
  'membership',
  'activity',
  'careNeeded',
  'followUp',
  'createdAt',
]);

const MAX_TEXT_LENGTH = 100;
const MAX_LIST_VALUES = 50;
const MAX_DAYS = 36_500;
const MAX_AGE = 130;
const MONTHS_IN_YEAR = 12;
const DAYS_IN_YEAR = 366;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The church's calendar: "today" flips at midnight in Lviv, not in UTC. */
const CHURCH_TIME_ZONE = 'Europe/Kyiv';

type Where = Prisma.PersonWhereInput;

/**
 * Turns an untrusted `?filter=` value into a checked filter. Every problem is a
 * 400 naming the exact condition, so a broken saved filter is easy to trace.
 */
export const parsePeopleFilter = (input: unknown): PeopleFilter => {
  const raw = typeof input === 'string' ? parseJson(input) : input;

  if (!isRecord(raw)) fail('filter must be an object');

  const match = raw.match ?? 'all';

  if (!FILTER_MATCHES.includes(match as FilterMatch)) {
    fail(`filter.match must be one of: ${FILTER_MATCHES.join(', ')}`);
  }

  const { conditions } = raw;

  if (!Array.isArray(conditions) || conditions.length === 0) {
    fail('filter.conditions must be a non-empty array');
  }

  if (conditions.length > MAX_FILTER_CONDITIONS) {
    fail(`filter.conditions must contain at most ${MAX_FILTER_CONDITIONS} items`);
  }

  return {
    match: match as FilterMatch,
    conditions: conditions.map((condition, index) =>
      parseCondition(condition, `filter.conditions[${index}]`),
    ),
  };
};

/** Builds the Prisma `where` for an already parsed filter. */
export const buildPeopleFilterWhere = (filter: PeopleFilter, now = new Date()): Where => {
  const today = toChurchDay(now);
  const clauses = filter.conditions.map((condition) => toWhere(condition, today, now));

  return filter.match === 'all' ? { AND: clauses } : { OR: clauses };
};

/**
 * An age range translates to a birth-date interval as of today. Comparisons on
 * birthDate also intentionally exclude people whose date of birth is unknown.
 */
export const toAgeWhere = (
  minAge: number | undefined,
  maxAge: number | undefined,
  now: Date,
): Where => {
  if (minAge === undefined && maxAge === undefined) return {};

  return {
    birthDate: {
      not: null,
      ...(minAge === undefined ? {} : { lte: yearsAgo(now, minAge) }),
      ...(maxAge === undefined ? {} : { gt: yearsAgo(now, maxAge + 1) }),
    },
  };
};

const parseCondition = (input: unknown, path: string): PeopleFilterCondition => {
  if (!isRecord(input)) fail(`${path} must be an object`);

  const { field, operator, value } = input;

  if (typeof field !== 'string' || !Object.hasOwn(FIELDS, field)) {
    fail(`${path}.field is not a filterable field`);
  }

  const definition: FieldDefinition = FIELDS[field as PeopleFilterField];
  const operators: readonly string[] =
    ('operators' in definition && definition.operators) || OPERATORS[definition.kind];

  if (typeof operator !== 'string' || !operators.includes(operator)) {
    fail(`${path}.operator must be one of: ${operators.join(', ')}`);
  }

  if (isEmptinessOperator(operator)) {
    if (value !== undefined && value !== null)
      fail(`${path}.value must be omitted for ${operator}`);

    if (!canBeEmpty(definition)) fail(`${path}.operator ${operator} does not apply to ${field}`);

    return { field: field as PeopleFilterField, operator: operator };
  }

  return {
    field: field as PeopleFilterField,
    operator: operator as FilterOperator,
    value: parseValue(definition, operator, value, `${path}.value`),
  };
};

const parseValue = (
  definition: FieldDefinition,
  operator: string,
  value: unknown,
  path: string,
): FilterValue => {
  switch (definition.kind) {
    case 'text':
      return parseText(value, path);

    case 'enum': {
      const values = parseList(value, path, (item) => parseText(item, path));
      const allowed = definition.values;

      if (allowed && values.some((item) => !allowed.includes(item))) {
        fail(`${path} must only contain: ${allowed.join(', ')}`);
      }

      return values;
    }

    case 'relation':
      return parseList(value, path, (item) => {
        if (typeof item !== 'string' || !DATABASE_UUID_PATTERN.test(item)) {
          fail(`${path} must only contain UUIDs`);
        }

        return item;
      });

    case 'date':
      if (operator === 'between') return parseRange(value, path, parseDate);

      if (operator === 'on' || operator === 'before' || operator === 'after') {
        return parseDate(value, path);
      }

      return parseInteger(value, path, 0, MAX_DAYS);

    case 'age':
      if (operator === 'between') {
        return parseRange(value, path, (item) => parseInteger(item, path, 0, MAX_AGE));
      }

      return parseInteger(value, path, 0, MAX_AGE);

    case 'boolean':
      if (typeof value !== 'boolean') fail(`${path} must be true or false`);

      return value;

    case 'overdueStep':
      if (typeof value !== 'boolean') fail(`${path} must be true or false`);

      return value;

    case 'step':
      return parseList(value, path, (item) => {
        if (typeof item !== 'string' || !DATABASE_UUID_PATTERN.test(item)) {
          fail(`${path} must only contain UUIDs`);
        }

        return item;
      });

    case 'ministryRole': {
      const roles: readonly string[] = Object.values(MinistryRole);

      return parseList(value, path, (item) => {
        if (typeof item !== 'string' || !roles.includes(item)) {
          fail(`${path} must only contain: ${roles.join(', ')}`);
        }

        return item;
      });
    }

    case 'birthday':
      if (operator === 'inMonths') {
        return parseList(value, path, (item) => parseInteger(item, path, 1, MONTHS_IN_YEAR));
      }

      return parseInteger(value, path, 0, DAYS_IN_YEAR);
  }
};

const toWhere = (
  { field, operator, value }: PeopleFilterCondition,
  today: Date,
  now: Date,
): Where => {
  const definition: FieldDefinition = FIELDS[field];

  switch (definition.kind) {
    case 'text':
      return toTextWhere(definition.columns, operator, value as string);

    case 'enum':
      return toEnumWhere(definition.column, operator, value as string[]);

    case 'relation':
      if (definition.relation === 'communities')
        return toCommunitiesWhere(operator, value as string[]);
      if (definition.relation === 'ministries')
        return toMinistriesWhere(operator, value as string[]);
      if (definition.relation === 'trainings') return toTrainingsWhere(operator, value as string[]);

      return toHomeGroupWhere(operator, value as string[]);

    case 'date':
      return toDateWhere(definition.column, operator, value, today);

    case 'age':
      return toAgeConditionWhere(operator, value, now);

    case 'boolean':
      return { [definition.column]: value as boolean };

    case 'ministryRole':
      return toMinistryRoleWhere(operator, value as string[]);

    case 'step':
      return toStepWhere(definition.done, operator, value as string[]);

    case 'overdueStep':
      return toOverdueStepWhere(value as boolean, today);

    case 'birthday':
      return toBirthdayWhere(operator, value, today);
  }
};

/**
 * Prisma sends `contains` and case-insensitive `equals` to PostgreSQL as ILIKE
 * without escaping, so a `%` typed into the filter would match every row.
 */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const toTextWhere = (columns: readonly TextColumn[], operator: FilterOperator, value: string) => {
  const matches = (column: TextColumn): Where => {
    const pattern = escapeLike(value);

    return {
      [column]:
        operator === 'contains' || operator === 'notContains'
          ? { contains: pattern, mode: 'insensitive' }
          : { equals: pattern, mode: 'insensitive' },
    };
  };

  // NULL ILIKE … is NULL, not false, so a plain NOT would silently drop blanks.
  const doesNotMatch = (column: TextColumn): Where =>
    REQUIRED_COLUMNS.has(column)
      ? { NOT: matches(column) }
      : { OR: [{ NOT: matches(column) }, { [column]: null }] };

  switch (operator) {
    case 'contains':
    case 'equals':
      return anyOf(columns.map(matches));

    case 'notContains':
    case 'notEquals':
      return allOf(columns.map(doesNotMatch));

    case 'isEmpty':
      return allOf(columns.map(isBlank));

    case 'isNotEmpty':
      return { NOT: allOf(columns.map(isBlank)) };

    default:
      return unsupported(operator);
  }
};

const toEnumWhere = (
  column: 'membership' | 'activity' | 'followUp' | 'gender',
  operator: FilterOperator,
  values: string[],
): Where => {
  switch (operator) {
    case 'in':
      return { [column]: { in: values } };

    case 'notIn':
      return REQUIRED_COLUMNS.has(column)
        ? { [column]: { notIn: values } }
        : { OR: [{ [column]: { notIn: values } }, { [column]: null }] };

    case 'isEmpty':
      return { [column]: null };

    case 'isNotEmpty':
      return { [column]: { not: null } };

    default:
      return unsupported(operator);
  }
};

const toCommunitiesWhere = (operator: FilterOperator, ids: string[]): Where => {
  switch (operator) {
    case 'in':
      return { communities: { some: { id: { in: ids } } } };

    case 'notIn':
      return { communities: { none: { id: { in: ids } } } };

    case 'isEmpty':
      return { communities: { none: {} } };

    case 'isNotEmpty':
      return { communities: { some: {} } };

    default:
      return unsupported(operator);
  }
};

const toHomeGroupWhere = (operator: FilterOperator, ids: string[]): Where => {
  switch (operator) {
    case 'in':
      return { homeGroupId: { in: ids } };

    case 'notIn':
      return { OR: [{ homeGroupId: { notIn: ids } }, { homeGroupId: null }] };

    case 'isEmpty':
      return { homeGroupId: null };

    case 'isNotEmpty':
      return { homeGroupId: { not: null } };

    default:
      return unsupported(operator);
  }
};

/**
 * Крок «у роботі» — запланований або початий. Завершені кроки шукаються окремо,
 * бо «має пройти хрещення» і «вже охрестився» — різні питання.
 */
const toStepWhere = (done: boolean, operator: FilterOperator, ids: string[]): Where => {
  const state = done ? { equals: StepState.DONE } : { in: OPEN_STEP_STATES };

  switch (operator) {
    case 'in':
      return { steps: { some: { stepTypeId: { in: ids }, state } } };

    case 'notIn':
      return { steps: { none: { stepTypeId: { in: ids }, state } } };

    case 'isEmpty':
      return { steps: { none: { state } } };

    case 'isNotEmpty':
      return { steps: { some: { state } } };

    default:
      return unsupported(operator);
  }
};

/** Прострочений крок — той, що в роботі й мав бути зроблений до сьогодні. */
const toOverdueStepWhere = (overdue: boolean, today: Date): Where => {
  const overdueStep = { state: { in: OPEN_STEP_STATES }, dueAt: { lt: today } };

  return overdue ? { steps: { some: overdueStep } } : { steps: { none: overdueStep } };
};

/**
 * Роль стосується участі, а не людини, тож «керівник» означає «керує хоча б одним
 * служінням». «Не керівник» — не керує жодним, навіть якщо десь є помічником.
 */
const toMinistryRoleWhere = (operator: FilterOperator, roles: string[]): Where => {
  const some = { role: { in: roles as MinistryRole[] }, until: null };

  switch (operator) {
    case 'in':
      return { ministryAssignments: { some } };

    case 'notIn':
      return { ministryAssignments: { none: some } };

    default:
      return unsupported(operator);
  }
};

/** Служіння читаються через участі, бо саме там лежить роль і період. */
const toMinistriesWhere = (operator: FilterOperator, ids: string[]): Where => {
  switch (operator) {
    case 'in':
      return { ministryAssignments: { some: { ministryId: { in: ids }, until: null } } };

    case 'notIn':
      return { ministryAssignments: { none: { ministryId: { in: ids }, until: null } } };

    case 'isEmpty':
      return { ministryAssignments: { none: { until: null } } };

    case 'isNotEmpty':
      return { ministryAssignments: { some: { until: null } } };

    default:
      return unsupported(operator);
  }
};

const toTrainingsWhere = (operator: FilterOperator, ids: string[]): Where => {
  switch (operator) {
    case 'in':
      return { trainings: { some: { id: { in: ids } } } };

    case 'notIn':
      return { trainings: { none: { id: { in: ids } } } };

    case 'isEmpty':
      return { trainings: { none: {} } };

    case 'isNotEmpty':
      return { trainings: { some: {} } };

    default:
      return unsupported(operator);
  }
};

/**
 * Days are whole calendar days, ends inclusive. Date columns hold midnight UTC,
 * so a day is `[midnight, next midnight)`. Relative operators count from today
 * and, like every comparison, leave out people with no date at all.
 */
const toDateWhere = (
  column: DateColumn,
  operator: FilterOperator,
  value: FilterValue | undefined,
  today: Date,
): Where => {
  const range = (gte: Date | undefined, lt: Date | undefined): Where => ({
    [column]: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) },
  });

  switch (operator) {
    case 'on': {
      const day = toDay(value as string);

      return range(day, addDays(day, 1));
    }

    case 'before':
      return range(undefined, toDay(value as string));

    case 'after':
      return range(addDays(toDay(value as string), 1), undefined);

    case 'between': {
      const [from, to] = value as string[];

      return range(toDay(from), addDays(toDay(to), 1));
    }

    case 'withinLastDays':
      return range(addDays(today, -(value as number)), addDays(today, 1));

    case 'moreThanDaysAgo':
      return range(undefined, addDays(today, -(value as number)));

    case 'withinNextDays':
      return range(today, addDays(today, (value as number) + 1));

    case 'isEmpty':
      return { [column]: null };

    case 'isNotEmpty':
      return { [column]: { not: null } };

    default:
      return unsupported(operator);
  }
};

const toAgeConditionWhere = (
  operator: FilterOperator,
  value: FilterValue | undefined,
  now: Date,
): Where => {
  switch (operator) {
    case 'equals':
      return toAgeWhere(value as number, value as number, now);

    case 'atLeast':
      return toAgeWhere(value as number, undefined, now);

    case 'atMost':
      return toAgeWhere(undefined, value as number, now);

    case 'between': {
      const [min, max] = value as number[];

      return toAgeWhere(min, max, now);
    }

    case 'isEmpty':
      return { birthDate: null };

    case 'isNotEmpty':
      return { birthDate: { not: null } };

    default:
      return unsupported(operator);
  }
};

/**
 * Birthdays are matched on the generated `birthMd` column — the birth date's month
 * and day as MMDD, so the year drops out and Postgres can index the comparison.
 */
const toBirthdayWhere = (
  operator: FilterOperator,
  value: FilterValue | undefined,
  today: Date,
): Where => {
  switch (operator) {
    case 'inMonths':
      return anyOf(
        (value as number[]).map((month) => ({
          birthMd: { gte: month * 100, lte: month * 100 + 99 },
        })),
      );

    case 'withinNextDays': {
      const days = value as number;

      if (days >= DAYS_IN_YEAR - 1) return { birthMd: { not: null } };

      const from = toMonthDay(today);
      const to = toMonthDay(addDays(today, days));

      // A window that runs past 31 December continues at 1 January.
      return from <= to
        ? { birthMd: { gte: from, lte: to } }
        : { OR: [{ birthMd: { gte: from } }, { birthMd: { lte: to } }] };
    }

    case 'isEmpty':
      return { birthMd: null };

    case 'isNotEmpty':
      return { birthMd: { not: null } };

    default:
      return unsupported(operator);
  }
};

/** The MMDD number the database stores for that day: 1 March is 301. */
const toMonthDay = (day: Date) => (day.getUTCMonth() + 1) * 100 + day.getUTCDate();

const isBlank = (column: string): Where =>
  REQUIRED_COLUMNS.has(column) ? { [column]: '' } : { OR: [{ [column]: null }, { [column]: '' }] };

const anyOf = (clauses: Where[]): Where => (clauses.length === 1 ? clauses[0] : { OR: clauses });

const allOf = (clauses: Where[]): Where => (clauses.length === 1 ? clauses[0] : { AND: clauses });

const isEmptinessOperator = (operator: string) =>
  operator === 'isEmpty' || operator === 'isNotEmpty';

/** A required column is never blank, so asking about emptiness is a mistake. */
const canBeEmpty = (definition: FieldDefinition) => {
  switch (definition.kind) {
    case 'text':
      return definition.columns.some((column) => !REQUIRED_COLUMNS.has(column));

    case 'enum':
    case 'date':
      return !REQUIRED_COLUMNS.has(definition.column);

    case 'birthday':
      return true;

    case 'boolean':
    case 'ministryRole':
    case 'overdueStep':
      return false;

    case 'step':
      return true;

    default:
      return true;
  }
};

const parseJson = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch {
    return fail('filter must be valid JSON');
  }
};

const parseText = (value: unknown, path: string): string => {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) fail(`${path} must be a non-empty string`);

  if (text.length > MAX_TEXT_LENGTH) {
    fail(`${path} must be shorter than or equal to ${MAX_TEXT_LENGTH} characters`);
  }

  return text;
};

const parseList = <T extends string | number>(
  value: unknown,
  path: string,
  parseItem: (item: unknown) => T,
): T[] => {
  if (!Array.isArray(value) || value.length === 0) fail(`${path} must be a non-empty array`);

  if (value.length > MAX_LIST_VALUES) {
    fail(`${path} must contain at most ${MAX_LIST_VALUES} items`);
  }

  return [...new Set(value.map(parseItem))];
};

const parseRange = <T extends string | number>(
  value: unknown,
  path: string,
  parseItem: (item: unknown, path: string) => T,
): T[] => {
  if (!Array.isArray(value) || value.length !== 2) fail(`${path} must be a [from, to] pair`);

  const [from, to] = [parseItem(value[0], path), parseItem(value[1], path)];

  if (from > to) fail(`${path} must not start after it ends`);

  return [from, to];
};

const parseDate = (value: unknown, path: string): string => {
  const valid =
    typeof value === 'string' &&
    ISO_DATE_PATTERN.test(value) &&
    // Rejects dates that only look valid, like 2026-02-30.
    toDay(value).toISOString().startsWith(value);

  if (!valid) fail(`${path} must be a date in YYYY-MM-DD format`);

  return value;
};

const parseInteger = (value: unknown, path: string, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    fail(`${path} must be an integer between ${min} and ${max}`);
  }

  return value;
};

const toDay = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

const addDays = (day: Date, days: number) => new Date(day.getTime() + days * DAY_MS);

/** Today's date in the church's time zone, as the midnight-UTC value a date column holds. */
const toChurchDay = (now: Date) =>
  toDay(new Intl.DateTimeFormat('en-CA', { timeZone: CHURCH_TIME_ZONE }).format(now));

const yearsAgo = (date: Date, years: number) => {
  const result = new Date(date);

  result.setFullYear(result.getFullYear() - years);

  return result;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Declarations rather than arrows: TypeScript only narrows after a `never` call
// when the callee is declared this way.
function fail(message: string): never {
  throw new BadRequestException(message);
}

/** Parsing already rejected the pair; reaching this means the two tables drifted apart. */
function unsupported(operator: string): never {
  throw new Error(`Unsupported filter operator: ${operator}`);
}
