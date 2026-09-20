import { formatDate } from '@/lib/format';
import type {
  Community,
  HomeGroup,
  Ministry,
  Training,
  PeopleFilterCondition,
  PeopleFilterField,
  PeopleFilterOperator,
} from '@/services';

import { FOLLOW_UP_LABELS, PERSON_STATUSES, PERSON_STATUS_LABELS } from './status';
import { PERSON_GENDERS, PERSON_GENDER_LABELS } from './gender';

/**
 * The client half of the API's filter allowlist
 * (`apps/api/src/api/person/filter/people-filter.ts`). The kind decides which
 * operators are offered and which control edits the value.
 */
export type FilterFieldKind = 'text' | 'enum' | 'relation' | 'date' | 'age' | 'birthday';

type FilterFieldDefinition = {
  field: PeopleFilterField;
  label: string;
  kind: FilterFieldKind;
  group: string;
  /** The column is never blank, so "вказано / не вказано" makes no sense for it. */
  required?: boolean;
  /** Narrows the operators the kind would otherwise offer. */
  operators?: PeopleFilterOperator[];
};

export const MONTHS = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

export const FILTER_FIELDS: FilterFieldDefinition[] = [
  { field: 'firstName', label: 'Імʼя', kind: 'text', group: 'Людина', required: true },
  { field: 'lastName', label: 'Прізвище', kind: 'text', group: 'Людина' },
  { field: 'gender', label: 'Стать', kind: 'enum', group: 'Людина' },
  { field: 'age', label: 'Вік', kind: 'age', group: 'Людина' },
  { field: 'birthday', label: 'День народження', kind: 'birthday', group: 'Людина' },
  {
    field: 'birthDate',
    label: 'Дата народження (з роком)',
    kind: 'date',
    group: 'Людина',
    // Relative operators would ask who was born in the last N days — that is a
    // newborn, not a birthday. Birthdays are the field above.
    operators: ['on', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
  },
  { field: 'notes', label: 'Нотатки', kind: 'text', group: 'Людина' },

  { field: 'phone', label: 'Телефон (будь-який)', kind: 'text', group: 'Контакти' },
  { field: 'email', label: 'Email', kind: 'text', group: 'Контакти' },
  { field: 'city', label: 'Місто', kind: 'text', group: 'Контакти' },
  { field: 'district', label: 'Район', kind: 'text', group: 'Контакти' },
  { field: 'region', label: 'Область', kind: 'text', group: 'Контакти' },
  { field: 'address', label: 'Вулиця, будинок', kind: 'text', group: 'Контакти' },

  { field: 'status', label: 'Статус', kind: 'enum', group: 'Супровід', required: true },
  { field: 'followUp', label: 'Follow-up', kind: 'enum', group: 'Супровід', required: true },
  { field: 'connectedBy', label: 'Connect', kind: 'text', group: 'Супровід' },
  { field: 'nextStep', label: 'Next Step', kind: 'text', group: 'Супровід' },
  { field: 'responsible', label: 'Відповідальний', kind: 'text', group: 'Супровід' },
  { field: 'nextAction', label: 'Наступна дія', kind: 'text', group: 'Супровід' },
  { field: 'nextActionAt', label: 'Коли зробити', kind: 'date', group: 'Супровід' },
  { field: 'firstVisitAt', label: 'Перший візит', kind: 'date', group: 'Супровід' },
  { field: 'lastSeenAt', label: 'Остання зустріч', kind: 'date', group: 'Супровід' },

  { field: 'communities', label: 'Спільноти', kind: 'relation', group: 'Спільноти й служіння' },
  { field: 'homeGroup', label: 'Домашня група', kind: 'relation', group: 'Спільноти й служіння' },
  { field: 'ministries', label: 'Служіння', kind: 'relation', group: 'Спільноти й служіння' },
  { field: 'trainings', label: 'Навчання', kind: 'relation', group: 'Спільноти й служіння' },

  { field: 'baptizedAt', label: 'Водне хрещення', kind: 'date', group: 'Членство' },
  { field: 'memberSince', label: 'Член церкви з', kind: 'date', group: 'Членство' },
  { field: 'leftAt', label: 'Вибув з членства', kind: 'date', group: 'Членство' },
  {
    field: 'createdAt',
    label: 'Додано в CRM',
    kind: 'date',
    group: 'Членство',
    required: true,
  },
];

/** Same cap as the API — past it a filter is better split into two views anyway. */
export const MAX_FILTER_CONDITIONS = 20;

export const FILTER_FIELD_GROUPS = [...new Set(FILTER_FIELDS.map(({ group }) => group))];

export const getFilterField = (field: PeopleFilterField) =>
  FILTER_FIELDS.find((definition) => definition.field === field)!;

const OPERATORS_BY_KIND: Record<FilterFieldKind, PeopleFilterOperator[]> = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'isEmpty', 'isNotEmpty'],
  enum: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  relation: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  date: [
    'withinLastDays',
    'moreThanDaysAgo',
    'withinNextDays',
    'on',
    'before',
    'after',
    'between',
    'isEmpty',
    'isNotEmpty',
  ],
  age: ['between', 'atLeast', 'atMost', 'equals', 'isEmpty', 'isNotEmpty'],
  birthday: ['withinNextDays', 'inMonths', 'isEmpty', 'isNotEmpty'],
};

export const getOperators = (field: PeopleFilterField) => {
  const { kind, required, operators } = getFilterField(field);

  return (operators ?? OPERATORS_BY_KIND[kind]).filter(
    (operator) => !required || !isEmptinessCheck(operator),
  );
};

/** How the operator reads in the builder's dropdown, per field kind. */
const OPERATOR_LABELS: Record<FilterFieldKind, Partial<Record<PeopleFilterOperator, string>>> = {
  text: {
    contains: 'містить',
    notContains: 'не містить',
    equals: 'дорівнює',
    notEquals: 'не дорівнює',
    isEmpty: 'не вказано',
    isNotEmpty: 'вказано',
  },
  enum: { in: 'є одним з', notIn: 'не є жодним з', isEmpty: 'не вказано', isNotEmpty: 'вказано' },
  relation: { in: 'будь-яка з', notIn: 'жодна з', isEmpty: 'немає', isNotEmpty: 'є' },
  date: {
    withinLastDays: 'за останні N днів',
    moreThanDaysAgo: 'понад N днів тому',
    withinNextDays: 'у найближчі N днів',
    on: 'в день',
    before: 'до',
    after: 'після',
    between: 'між',
    isEmpty: 'не вказано',
    isNotEmpty: 'вказано',
  },
  birthday: {
    withinNextDays: 'у найближчі N днів',
    inMonths: 'у місяцях',
    isEmpty: 'дата невідома',
    isNotEmpty: 'дата відома',
  },
  age: {
    between: 'між',
    atLeast: 'від',
    atMost: 'до',
    equals: 'дорівнює',
    isEmpty: 'невідомий',
    isNotEmpty: 'відомий',
  },
};

export const getOperatorLabel = (field: PeopleFilterField, operator: PeopleFilterOperator) =>
  OPERATOR_LABELS[getFilterField(field).kind][operator] ?? operator;

export const isEmptinessCheck = (operator: PeopleFilterOperator) =>
  operator === 'isEmpty' || operator === 'isNotEmpty';

/** Values the list-type fields choose from — loaded by the page, passed down. */
export type FilterOptionSources = {
  communities: Pick<Community, 'id' | 'name'>[];
  homeGroups: Pick<HomeGroup, 'id' | 'name'>[];
  ministries: Pick<Ministry, 'id' | 'name' | 'community'>[];
  trainings: Pick<Training, 'id' | 'name'>[];
};

export type FilterOption = { value: string; label: string };

export const getFilterOptions = (
  field: PeopleFilterField,
  sources: FilterOptionSources,
): FilterOption[] => {
  switch (field) {
    case 'gender':
      return PERSON_GENDERS.map((value) => ({ value, label: PERSON_GENDER_LABELS[value] }));

    case 'status':
      return PERSON_STATUSES.map((value) => ({ value, label: PERSON_STATUS_LABELS[value] }));

    case 'followUp':
      return Object.entries(FOLLOW_UP_LABELS).map(([value, label]) => ({ value, label }));

    case 'ministries':
      return sources.ministries.map((ministry) => ({
        value: ministry.id,
        label: `${ministry.name} · ${ministry.community?.name ?? 'Для всіх спільнот'}`,
      }));

    case 'trainings':
      return sources.trainings.map(({ id, name }) => ({ value: id, label: name }));

    case 'communities':
      return sources.communities.map(({ id, name }) => ({ value: id, label: name }));

    case 'homeGroup':
      return sources.homeGroups.map(({ id, name }) => ({ value: id, label: name }));

    case 'birthday':
      return MONTHS.map((label, index) => ({ value: String(index + 1), label }));

    default:
      return [];
  }
};

/**
 * A condition as the builder edits it: numbers stay strings while typed, so a
 * half-filled row is representable. `toCondition` turns it into what the API takes.
 */
export type ConditionDraft = {
  key: string;
  field: PeopleFilterField;
  operator: PeopleFilterOperator;
  text: string;
  list: string[];
  range: [string, string];
};

let draftSequence = 0;

/** React needs a stable key per row; the index shifts when a middle row is removed. */
const nextDraftKey = () => `condition-${(draftSequence += 1)}`;

export const createDraft = (field: PeopleFilterField = 'status'): ConditionDraft => ({
  key: nextDraftKey(),
  field,
  operator: getOperators(field)[0],
  text: '',
  list: [],
  range: ['', ''],
});

/** What kind of value the operator needs — and so which control edits it. */
export type ValueShape =
  | 'none'
  | 'text'
  | 'list'
  /** Months picked as a list but sent as numbers 1–12. */
  | 'monthList'
  | 'date'
  | 'dateRange'
  | 'number'
  | 'numberRange';

export const getValueShape = (
  field: PeopleFilterField,
  operator: PeopleFilterOperator,
): ValueShape => {
  if (isEmptinessCheck(operator)) return 'none';

  switch (getFilterField(field).kind) {
    case 'text':
      return 'text';

    case 'enum':
    case 'relation':
      return 'list';

    case 'date':
      if (operator === 'between') return 'dateRange';

      return operator === 'on' || operator === 'before' || operator === 'after' ? 'date' : 'number';

    case 'age':
      return operator === 'between' ? 'numberRange' : 'number';

    case 'birthday':
      return operator === 'inMonths' ? 'monthList' : 'number';
  }
};

const toWholeNumber = (value: string) => {
  const number = Number(value);

  return value.trim() !== '' && Number.isInteger(number) && number >= 0 ? number : null;
};

/** `null` while the row is incomplete, so Apply can stay disabled. */
export const toCondition = (draft: ConditionDraft): PeopleFilterCondition | null => {
  const { field, operator } = draft;

  switch (getValueShape(field, operator)) {
    case 'none':
      return { field, operator };

    case 'text': {
      const text = draft.text.trim();

      return text ? { field, operator, value: text } : null;
    }

    case 'list':
      return draft.list.length > 0 ? { field, operator, value: draft.list } : null;

    case 'monthList':
      return draft.list.length > 0
        ? { field, operator, value: draft.list.map(Number).sort((a, b) => a - b) }
        : null;

    case 'date':
      return draft.text ? { field, operator, value: draft.text } : null;

    case 'dateRange': {
      const [from, to] = draft.range;

      return from && to && from <= to ? { field, operator, value: [from, to] } : null;
    }

    case 'number': {
      const number = toWholeNumber(draft.text);

      return number === null ? null : { field, operator, value: number };
    }

    case 'numberRange': {
      const [from, to] = draft.range.map(toWholeNumber);

      return from !== null && to !== null && from <= to
        ? { field, operator, value: [from, to] }
        : null;
    }
  }
};

export const toDraft = (condition: PeopleFilterCondition): ConditionDraft => {
  const draft = { ...createDraft(condition.field), operator: condition.operator };
  const { value } = condition;

  if (Array.isArray(value)) {
    const shape = getValueShape(condition.field, condition.operator);

    return shape === 'list' || shape === 'monthList'
      ? { ...draft, list: value.map(String) }
      : { ...draft, range: [String(value[0] ?? ''), String(value[1] ?? '')] };
  }

  return { ...draft, text: value === undefined ? '' : String(value) };
};

/** "1 день", "3 дні", "60 днів". */
export const pluralizeDays = (count: number) => {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) return `${count} днів`;
  if (last === 1) return `${count} день`;
  if (last >= 2 && last <= 4) return `${count} дні`;

  return `${count} днів`;
};

/** One line per condition for the chips: "Остання зустріч: понад 60 днів тому". */
export const describeCondition = (
  { field, operator, value }: PeopleFilterCondition,
  sources: FilterOptionSources,
): string => {
  const { label } = getFilterField(field);
  const optionLabel = (item: string) =>
    getFilterOptions(field, sources).find((option) => option.value === item)?.label ?? item;

  const detail = (() => {
    switch (operator) {
      case 'isEmpty':
      case 'isNotEmpty':
        return getOperatorLabel(field, operator);

      case 'in':
        return (value as string[]).map(optionLabel).join(' або ');

      case 'inMonths':
        return (value as number[]).map((month) => optionLabel(String(month))).join(' або ');

      case 'notIn':
        return `не ${(value as string[]).map(optionLabel).join(', не ')}`;

      case 'contains':
        return `містить «${value}»`;

      case 'notContains':
        return `не містить «${value}»`;

      case 'equals':
        return field === 'age' ? `${value} р.` : `«${value}»`;

      case 'notEquals':
        return `не «${value}»`;

      case 'on':
        return formatDate(value as string);

      case 'before':
        return `до ${formatDate(value as string)}`;

      case 'after':
        return `після ${formatDate(value as string)}`;

      case 'between': {
        const [from, to] = value as (string | number)[];

        return field === 'age'
          ? `${from}–${to} р.`
          : `${formatDate(from as string)} – ${formatDate(to as string)}`;
      }

      case 'withinLastDays':
        return value === 0 ? 'сьогодні' : `за останні ${pluralizeDays(value as number)}`;

      case 'moreThanDaysAgo':
        return `понад ${pluralizeDays(value as number)} тому`;

      case 'withinNextDays':
        return value === 0 ? 'сьогодні' : `у найближчі ${pluralizeDays(value as number)}`;

      case 'atLeast':
        return `від ${value} р.`;

      case 'atMost':
        return `до ${value} р.`;
    }
  })();

  return `${label}: ${detail}`;
};
