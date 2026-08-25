import { formatDate } from '@/lib/format';
import { getPersonName, type Person } from '@/services';

import { PERSON_STATUS_LABELS } from './status';

const COLUMNS = [
  'Імʼя',
  'Статус',
  'Мала група',
  'Служіння',
  'Остання зустріч',
  'Телефон',
  'Email',
  'Місто',
] as const;

const escape = (value: string) =>
  /[";\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

const toRow = (person: Person) =>
  [
    getPersonName(person),
    PERSON_STATUS_LABELS[person.status],
    person.smallGroup ?? '',
    person.ministry ?? '',
    person.lastSeenAt ? formatDate(person.lastSeenAt) : '',
    person.phone ?? '',
    person.email ?? '',
    person.city ?? '',
  ].map((value) => escape(String(value)));

/**
 * Semicolon-separated with a BOM — that is what Ukrainian Excel opens without
 * an import wizard.
 */
export const exportPeopleToCsv = (people: Person[], fileName = 'people.csv') => {
  const csv = [COLUMNS, ...people.map(toRow)].map((row) => row.join(';')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};
