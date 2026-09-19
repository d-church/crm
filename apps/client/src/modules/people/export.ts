import type { Person } from '@/services';

import type { PersonColumn } from './people-columns';

const escape = (value: string) =>
  /[";\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

/**
 * The columns on screen, in their order — an export matches what was exported from.
 * Semicolon-separated with a BOM: that is what Ukrainian Excel opens without an
 * import wizard.
 */
export const exportPeopleToCsv = (
  people: Person[],
  columns: PersonColumn[],
  fileName = 'people.csv',
) => {
  const rows = [
    columns.map(({ label }) => label),
    ...people.map((person) => columns.map((column) => escape(column.text(person)))),
  ];
  const csv = rows.map((row) => row.join(';')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};
