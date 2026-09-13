import { z } from 'zod';

import { toDateInputValue } from '@/lib/format';
import { FollowUpState, PersonStatus, type Person, type Writable } from '@/services';

import { FOLLOW_UP_STATES, PERSON_STATUSES } from './status';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const personSchema = z.object({
  firstName: z.string().trim().min(2, 'Мінімум 2 символи').max(50, 'Максимум 50 символів'),
  lastName: optionalText(50),
  status: z.enum(PERSON_STATUSES as [PersonStatus, ...PersonStatus[]]),
  followUp: z.enum(FOLLOW_UP_STATES as [FollowUpState, ...FollowUpState[]]),

  phone: optionalText(30),
  homePhone: optionalText(30),
  workPhone: optionalText(30),
  email: z.union([z.literal(''), z.string().email('Некоректний email')]).optional(),

  city: optionalText(80),
  address: optionalText(200),
  postalCode: optionalText(10),
  district: optionalText(80),
  region: optionalText(80),

  firstVisitAt: optionalText(10),
  lastSeenAt: optionalText(10),
  connectedBy: optionalText(80),
  nextStep: optionalText(120),
  communityId: z.union([z.literal(''), z.string().uuid()]).optional(),
  ministry: optionalText(80),
  responsible: optionalText(80),
  nextAction: optionalText(200),
  nextActionAt: optionalText(10),

  birthDate: optionalText(10),
  baptizedAt: optionalText(10),
  memberSince: optionalText(10),
  leftAt: optionalText(10),

  notes: optionalText(2000),
});

export type PersonValues = z.infer<typeof personSchema>;
export type PersonField = keyof PersonValues;
export type PersonPayload = Omit<Writable<Person>, 'community'>;

export const EMPTY_PERSON_VALUES: PersonValues = {
  firstName: '',
  lastName: '',
  status: PersonStatus.NEW,
  followUp: FollowUpState.NOT_DONE,
  phone: '',
  homePhone: '',
  workPhone: '',
  email: '',
  city: '',
  address: '',
  postalCode: '',
  district: '',
  region: '',
  firstVisitAt: '',
  lastSeenAt: '',
  connectedBy: '',
  nextStep: '',
  communityId: '',
  ministry: '',
  responsible: '',
  nextAction: '',
  nextActionAt: '',
  birthDate: '',
  baptizedAt: '',
  memberSince: '',
  leftAt: '',
  notes: '',
};

const DATE_KEYS = [
  'firstVisitAt',
  'lastSeenAt',
  'nextActionAt',
  'birthDate',
  'baptizedAt',
  'memberSince',
  'leftAt',
] as const satisfies readonly PersonField[];

const DATE_KEY_SET = new Set<PersonField>(DATE_KEYS);

/** Every text input needs a string, and every date input needs `YYYY-MM-DD`. */
export const toPersonValues = (person: Person): PersonValues =>
  Object.fromEntries(
    Object.entries(EMPTY_PERSON_VALUES).map(([key, fallback]) => {
      const value = person[key as keyof Person];

      if (value == null) return [key, fallback];

      return [
        key,
        DATE_KEY_SET.has(key as PersonField) ? toDateInputValue(String(value)) : String(value),
      ];
    }),
  ) as PersonValues;

/** Blanks clear existing values on edit and are omitted when a person is created. */
export const toPersonPayload = (values: Partial<PersonValues>, isEdit: boolean): PersonPayload =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value])
      .filter(([, value]) => isEdit || value !== null),
  ) as PersonPayload;

export const pickPersonValues = (
  values: PersonValues,
  fields: readonly PersonField[],
): Partial<PersonValues> =>
  Object.fromEntries(fields.map((field) => [field, values[field]])) as Partial<PersonValues>;
