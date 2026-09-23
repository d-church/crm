import { getAge, toDateInputValue } from '@/lib/format';
import type { Person } from '@/services';

import { PERSON_GENDERS, PERSON_GENDER_LABELS } from './gender';
import type { InlineFieldOption, InlineFieldType } from './inline-field';
import {
  ACTIVITY_LABELS,
  ACTIVITY_STATES,
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATES,
  MEMBERSHIP_LABELS,
  MEMBERSHIP_STATUSES,
} from './status';

/** Поля, які людина редагує просто як значення — без окремих діалогів. */
export type PersonScalarField =
  | 'lastName'
  | 'gender'
  | 'membership'
  | 'activity'
  | 'followUp'
  | 'phone'
  | 'homePhone'
  | 'workPhone'
  | 'email'
  | 'city'
  | 'address'
  | 'postalCode'
  | 'district'
  | 'region'
  | 'birthDate'
  | 'baptizedAt'
  | 'memberSince'
  | 'leftAt'
  | 'firstVisitAt'
  | 'lastSeenAt'
  | 'connectedBy'
  | 'responsible'
  | 'notes';

type FieldDefinition = {
  field: PersonScalarField;
  label: string;
  type: InlineFieldType;
  options?: InlineFieldOption[];
  maxLength?: number;
};

const toOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): InlineFieldOption[] => values.map((value) => ({ value, label: labels[value] }));

export const PERSON_FIELDS: Record<PersonScalarField, FieldDefinition> = {
  lastName: { field: 'lastName', label: 'Прізвище', type: 'text', maxLength: 50 },
  gender: {
    field: 'gender',
    label: 'Стать',
    type: 'select',
    options: toOptions(PERSON_GENDERS, PERSON_GENDER_LABELS),
  },
  membership: {
    field: 'membership',
    label: 'Статус',
    type: 'select',
    options: toOptions(MEMBERSHIP_STATUSES, MEMBERSHIP_LABELS),
  },
  activity: {
    field: 'activity',
    label: 'Активність',
    type: 'select',
    options: toOptions(ACTIVITY_STATES, ACTIVITY_LABELS),
  },
  followUp: {
    field: 'followUp',
    label: 'Follow-up',
    type: 'select',
    options: toOptions(FOLLOW_UP_STATES, FOLLOW_UP_LABELS),
  },
  phone: { field: 'phone', label: 'Телефон', type: 'phone', maxLength: 30 },
  homePhone: { field: 'homePhone', label: 'Домашній телефон', type: 'phone', maxLength: 30 },
  workPhone: { field: 'workPhone', label: 'Робочий телефон', type: 'phone', maxLength: 30 },
  email: { field: 'email', label: 'Email', type: 'email', maxLength: 120 },
  city: { field: 'city', label: 'Місто', type: 'text', maxLength: 80 },
  address: { field: 'address', label: 'Вулиця, будинок', type: 'text', maxLength: 160 },
  postalCode: { field: 'postalCode', label: 'Індекс', type: 'text', maxLength: 10 },
  district: { field: 'district', label: 'Район', type: 'text', maxLength: 80 },
  region: { field: 'region', label: 'Область', type: 'text', maxLength: 80 },
  birthDate: { field: 'birthDate', label: 'Дата народження', type: 'date' },
  baptizedAt: { field: 'baptizedAt', label: 'Водне хрещення', type: 'date' },
  memberSince: { field: 'memberSince', label: 'Член церкви з', type: 'date' },
  leftAt: { field: 'leftAt', label: 'Вибув з членства', type: 'date' },
  firstVisitAt: { field: 'firstVisitAt', label: 'Перший візит', type: 'date' },
  lastSeenAt: { field: 'lastSeenAt', label: 'Остання зустріч', type: 'date' },
  connectedBy: { field: 'connectedBy', label: 'Connect', type: 'text', maxLength: 80 },
  responsible: { field: 'responsible', label: 'Відповідальний', type: 'text', maxLength: 80 },
  notes: { field: 'notes', label: 'Нотатки', type: 'textarea', maxLength: 2000 },
};

/**
 * Три секції картки. «Шлях у церкві» свідомо тримає разом дати й супровід: для
 * пастора це одна історія людини, а не два різні списки. «Деталі» — довідкове,
 * тому секція згорнута, поки її не відкриють.
 */
export const PERSON_FIELD_GROUPS: {
  title: string;
  fields: PersonScalarField[];
  collapsed?: boolean;
  /** Головна колонка — те, з чим працюють; бічна — довідка про людину. */
  column?: 'main' | 'side';
}[] = [
  { title: 'Контакти', fields: ['phone', 'email', 'city', 'address'], column: 'side' },
  {
    title: 'Шлях у церкві',
    column: 'main',
    fields: [
      'firstVisitAt',
      'lastSeenAt',
      'baptizedAt',
      'memberSince',
      'leftAt',
      'connectedBy',
      'responsible',
    ],
  },
  {
    title: 'Деталі',
    fields: [
      'lastName',
      'gender',
      'birthDate',
      'homePhone',
      'workPhone',
      'district',
      'region',
      'postalCode',
    ],
    collapsed: true,
  },
];

/** Значення для поля у вигляді, придатному і для читання, і для редагування. */
export const getFieldValue = (person: Person, field: PersonScalarField): string => {
  const value = person[field];

  if (value == null) return '';

  return PERSON_FIELDS[field].type === 'date' ? toDateInputValue(String(value)) : String(value);
};

/** Приписка біля значення: вік біля дати народження читається одразу. */
export const getFieldHint = (person: Person, field: PersonScalarField): string | undefined => {
  if (field !== 'birthDate') return undefined;

  const age = getAge(person.birthDate);

  return age === null ? undefined : `${age} р.`;
};
