import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { z } from 'zod';

import { createLocalStore } from '@/lib/local-store';
import { formatDate, formatDayMonth, getAge, getInitials } from '@/lib/format';
import { useAuth } from '@/modules/auth';
import { getPersonName, type PeopleSort, type Person } from '@/services';

import { getPersonMeta } from './filtering';
import { PERSON_GENDER_LABELS } from './gender';
import { PersonStatusBadge } from './person-status-badge';
import { FOLLOW_UP_LABELS, PERSON_STATUS_LABELS } from './status';

type PersonColumn = {
  key: string;
  label: string;
  /** Share of the leftover width, as a grid `fr` value. */
  width: number;
  /** Below this the column stops shrinking and the table scrolls sideways. */
  minWidth: number;
  align?: 'right';
  /** How the API orders by this column; without it the header does not sort. */
  sortKey?: PeopleSort;
  /** Shown in the table; falls back to the CSV text when omitted. */
  cell?: (person: Person) => ReactNode;
  /** Plain text for the CSV export. */
  text: (person: Person) => string;
};

const dash = '—';
const date = (value: string | null) => (value ? formatDate(value) : '');
const text = (value: string | null) => value ?? '';

export const PERSON_COLUMNS: PersonColumn[] = [
  {
    key: 'name',
    label: 'Імʼя',
    width: 2.1,
    minWidth: 220,
    sortKey: 'name',
    text: (person) => getPersonName(person),
    cell: (person) => {
      const name = getPersonName(person);
      const meta = getPersonMeta(person);

      return (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 flex-none place-items-center rounded-full bg-[#e6ece5] text-[11.5px] text-[#3f4a43]">
            {getInitials(name)}
          </span>

          <span className="flex min-w-0 flex-col">
            <Link
              to="/people/$personId"
              params={{ personId: person.id }}
              className="text-foreground truncate text-[13.5px] underline-offset-3 hover:underline"
            >
              {name}
            </Link>
            {meta ? <span className="text-ink-faint text-[11.5px]">{meta}</span> : null}
          </span>
        </div>
      );
    },
  },
  {
    key: 'gender',
    label: 'Стать',
    width: 0.8,
    minWidth: 100,
    sortKey: 'gender',
    text: (person) => (person.gender ? PERSON_GENDER_LABELS[person.gender] : ''),
  },
  {
    key: 'status',
    label: 'Статус',
    width: 1.1,
    minWidth: 130,
    sortKey: 'status',
    text: (person) => PERSON_STATUS_LABELS[person.status],
    cell: (person) => <PersonStatusBadge status={person.status} className="justify-self-start" />,
  },
  {
    key: 'communities',
    label: 'Спільнота',
    width: 1.3,
    minWidth: 150,
    text: (person) => person.communities.map(({ name }) => name).join(', '),
    cell: (person) => (
      <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[13px]">
        {person.communities.length === 0 ? (
          <span className="text-ink">ще немає</span>
        ) : (
          person.communities.map((community) => (
            <Link
              key={community.id}
              to="/communities/$communityId"
              params={{ communityId: community.id }}
              className="text-ink truncate underline-offset-3 hover:underline"
            >
              {community.name}
            </Link>
          ))
        )}
      </div>
    ),
  },
  {
    key: 'homeGroup',
    label: 'Домашня група',
    width: 1.2,
    minWidth: 150,
    sortKey: 'homeGroup',
    text: (person) => person.homeGroup?.name ?? '',
    cell: (person) =>
      person.homeGroup ? (
        <Link
          to="/home-groups/$homeGroupId"
          params={{ homeGroupId: person.homeGroup.id }}
          className="text-ink truncate text-[13px] underline-offset-3 hover:underline"
        >
          {person.homeGroup.name}
        </Link>
      ) : (
        <span className="text-ink-soft text-[13px]">{dash}</span>
      ),
  },
  {
    key: 'ministries',
    label: 'Служіння',
    width: 1.2,
    minWidth: 140,
    text: (person) => person.ministries.map(({ name }) => name).join(', '),
    cell: (person) => (
      <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[13px]">
        {person.ministries.length === 0 ? (
          <span className="text-ink-soft">{dash}</span>
        ) : (
          person.ministries.map((ministry) => (
            <Link
              key={ministry.id}
              to="/ministries/$ministryId"
              params={{ ministryId: ministry.id }}
              className="text-ink truncate underline-offset-3 hover:underline"
            >
              {ministry.name}
            </Link>
          ))
        )}
      </div>
    ),
  },
  {
    key: 'lastSeenAt',
    label: 'Остання зустріч',
    width: 0.9,
    minWidth: 120,
    sortKey: 'lastSeenAt',
    text: (person) => date(person.lastSeenAt),
    cell: (person) => (
      <span className="text-ink-soft text-[13px] tabular-nums">
        {person.lastSeenAt ? formatDayMonth(person.lastSeenAt) : dash}
      </span>
    ),
  },
  {
    key: 'phone',
    label: 'Контакт',
    width: 0.8,
    minWidth: 130,
    align: 'right',
    sortKey: 'phone',
    text: (person) => text(person.phone),
  },
  {
    key: 'email',
    label: 'Email',
    width: 1.3,
    minWidth: 170,
    sortKey: 'email',
    text: (p) => text(p.email),
  },
  {
    key: 'city',
    label: 'Місто',
    width: 0.9,
    minWidth: 110,
    sortKey: 'city',
    text: (p) => text(p.city),
  },
  {
    key: 'address',
    label: 'Адреса',
    width: 1.3,
    minWidth: 160,
    sortKey: 'address',
    text: (p) => text(p.address),
  },
  {
    key: 'district',
    label: 'Район',
    width: 0.9,
    minWidth: 110,
    sortKey: 'district',
    text: (p) => text(p.district),
  },
  {
    key: 'region',
    label: 'Область',
    width: 0.9,
    minWidth: 110,
    sortKey: 'region',
    text: (p) => text(p.region),
  },
  {
    key: 'age',
    label: 'Вік',
    width: 0.5,
    minWidth: 70,
    sortKey: 'age',
    text: (person) => {
      const age = getAge(person.birthDate);

      return age === null ? '' : String(age);
    },
  },
  {
    key: 'birthDate',
    label: 'Дата народження',
    width: 0.9,
    minWidth: 130,
    sortKey: 'birthDate',
    text: (p) => date(p.birthDate),
  },
  {
    key: 'birthday',
    label: 'День народження',
    width: 0.8,
    minWidth: 120,
    // Sorted by day and month, so the list reads as the year's birthday calendar.
    sortKey: 'birthday',
    text: (person) => (person.birthDate ? formatDayMonth(person.birthDate) : ''),
  },
  {
    key: 'followUp',
    label: 'Follow-up',
    width: 0.9,
    minWidth: 120,
    sortKey: 'followUp',
    text: (person) => FOLLOW_UP_LABELS[person.followUp],
  },
  {
    key: 'connectedBy',
    label: 'Connect',
    width: 1,
    minWidth: 130,
    sortKey: 'connectedBy',
    text: (p) => text(p.connectedBy),
  },
  {
    key: 'nextStep',
    label: 'Next Step',
    width: 1.2,
    minWidth: 150,
    sortKey: 'nextStep',
    text: (p) => text(p.nextStep),
  },
  {
    key: 'responsible',
    label: 'Відповідальний',
    width: 1,
    minWidth: 140,
    sortKey: 'responsible',
    text: (p) => text(p.responsible),
  },
  {
    key: 'nextAction',
    label: 'Наступна дія',
    width: 1.3,
    minWidth: 160,
    sortKey: 'nextAction',
    text: (p) => text(p.nextAction),
  },
  {
    key: 'nextActionAt',
    label: 'Коли зробити',
    width: 0.9,
    minWidth: 130,
    sortKey: 'nextActionAt',
    text: (p) => date(p.nextActionAt),
  },
  {
    key: 'firstVisitAt',
    label: 'Перший візит',
    width: 0.9,
    minWidth: 130,
    sortKey: 'firstVisitAt',
    text: (p) => date(p.firstVisitAt),
  },
  {
    key: 'baptizedAt',
    label: 'Водне хрещення',
    width: 0.9,
    minWidth: 130,
    sortKey: 'baptizedAt',
    text: (p) => date(p.baptizedAt),
  },
  {
    key: 'memberSince',
    label: 'Член церкви з',
    width: 0.9,
    minWidth: 130,
    sortKey: 'memberSince',
    text: (p) => date(p.memberSince),
  },
  {
    key: 'leftAt',
    label: 'Вибув',
    width: 0.9,
    minWidth: 120,
    sortKey: 'leftAt',
    text: (p) => date(p.leftAt),
  },
  {
    key: 'createdAt',
    label: 'Додано в CRM',
    width: 0.9,
    minWidth: 130,
    sortKey: 'createdAt',
    text: (p) => date(p.createdAt),
  },
  {
    key: 'notes',
    label: 'Нотатки',
    width: 1.6,
    minWidth: 200,
    sortKey: 'notes',
    text: (p) => text(p.notes),
  },
];

/** Without a name the row cannot be identified, so this one cannot be hidden. */
export const REQUIRED_COLUMN_KEY = 'name';

export const DEFAULT_COLUMN_KEYS = [
  'name',
  'gender',
  'status',
  'communities',
  'ministries',
  'lastSeenAt',
  'phone',
];

const PREVIOUS_DEFAULT_COLUMN_KEYS = DEFAULT_COLUMN_KEYS.filter((key) => key !== 'gender');

const COLUMN_KEYS = PERSON_COLUMNS.map(({ key }) => key);

export const getColumn = (key: string) => PERSON_COLUMNS.find((column) => column.key === key)!;

const storageKey = (userId: string) => `dchurch-crm.people.columns.${userId}`;

type ColumnSelection = { version: 2; keys: string[] };
const DEFAULT_COLUMN_SELECTION: ColumnSelection = { version: 2, keys: DEFAULT_COLUMN_KEYS };

/** Upgrade old default lists once; versioned saves let users hide the new column again. */
const store = createLocalStore<ColumnSelection>((raw) => {
  const legacy = z.array(z.string()).safeParse(raw);
  const current = z.object({ version: z.literal(2), keys: z.array(z.string()) }).safeParse(raw);
  const rawKeys = legacy.success ? legacy.data : current.success ? current.data.keys : null;

  if (!rawKeys) return DEFAULT_COLUMN_SELECTION;

  const keys = [...new Set(rawKeys)].filter((key) => COLUMN_KEYS.includes(key));

  if (keys.length === 0) return DEFAULT_COLUMN_SELECTION;

  if (
    legacy.success &&
    keys.length === PREVIOUS_DEFAULT_COLUMN_KEYS.length &&
    keys.every((columnKey, index) => columnKey === PREVIOUS_DEFAULT_COLUMN_KEYS[index])
  ) {
    return DEFAULT_COLUMN_SELECTION;
  }

  return {
    version: 2,
    keys: keys.includes(REQUIRED_COLUMN_KEY) ? keys : [REQUIRED_COLUMN_KEY, ...keys],
  };
}, DEFAULT_COLUMN_SELECTION);

export const usePeopleColumns = () => {
  const { user } = useAuth();
  const key = storageKey(user?.id ?? 'anonymous');
  const visibleKeys = store.useValue(key).keys;

  return {
    visibleKeys,
    columns: visibleKeys.map(getColumn),
    /** `false` when the browser refuses to store the choice. */
    setVisibleKeys: (keys: string[]) => store.write(key, { version: 2, keys }),
    reset: () => store.write(key, DEFAULT_COLUMN_SELECTION),
    isDefault:
      visibleKeys.length === DEFAULT_COLUMN_KEYS.length &&
      visibleKeys.every((columnKey, index) => columnKey === DEFAULT_COLUMN_KEYS[index]),
  };
};

export type { PersonColumn };
