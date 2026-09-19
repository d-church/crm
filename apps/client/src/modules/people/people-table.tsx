import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { PeopleSort, Person, SortOrder } from '@/services';

import { usePeopleColumns, type PersonColumn } from './people-columns';

type PeopleTableProps = {
  people: Person[];
  /** Omitted on detail pages, where the list has one fixed order and no headers to click. */
  sort?: { field: PeopleSort; order: SortOrder };
  onSortChange?: (sort: { field: PeopleSort; order: SortOrder }) => void;
};

/** One grid template drives both the header and the rows. */
const toGridStyle = (columns: PersonColumn[]) => ({
  gridTemplateColumns: columns
    .map(({ minWidth, width }) => `minmax(${minWidth}px, ${width}fr)`)
    .join(' '),
});

const GRID = 'grid gap-4 px-5';

/** Columns come from the one per-browser choice, so every people list matches. */
export const PeopleTable = ({ people, sort, onSortChange }: PeopleTableProps) => {
  const { columns } = usePeopleColumns();

  // Narrower than the sum of the minimums the table scrolls instead of squashing.
  const minWidth = columns.reduce((total, column) => total + column.minWidth, 0) + 40;
  const style = toGridStyle(columns);

  return (
    <div style={{ minWidth }}>
      <div
        className={cn(GRID, 'eyebrow text-muted-foreground border-border-muted border-b py-3')}
        style={style}
      >
        {columns.map((column) => (
          <ColumnHeader key={column.key} column={column} sort={sort} onSortChange={onSortChange} />
        ))}
      </div>

      {people.map((person) => (
        <div
          key={person.id}
          className={cn(
            GRID,
            'border-border-subtle hover:bg-accent items-center border-b py-3.25 transition-colors',
          )}
          style={style}
        >
          {columns.map((column) => (
            <div key={column.key} className="min-w-0">
              {column.cell ? (
                column.cell(person)
              ) : (
                <span
                  className={cn(
                    'text-ink block truncate text-[13px]',
                    column.align === 'right' &&
                      'text-ink-soft text-right text-[12.5px] tabular-nums',
                  )}
                >
                  {column.text(person) || '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

type ColumnHeaderProps = {
  column: PersonColumn;
} & Pick<PeopleTableProps, 'sort' | 'onSortChange'>;

/**
 * Sorting starts ascending — alphabetical for text, smallest first for numbers and
 * dates — and the same header flips it. Columns the API cannot order by, and lists
 * without a sort handler, stay plain labels.
 */
const ColumnHeader = ({ column, sort, onSortChange }: ColumnHeaderProps) => {
  const { sortKey, label, align } = column;

  if (!sortKey || !onSortChange) {
    return <span className={cn(align === 'right' && 'text-right')}>{label}</span>;
  }

  const isActive = sort?.field === sortKey;
  const order: SortOrder = isActive && sort.order === 'asc' ? 'desc' : 'asc';
  const Icon = !isActive ? ChevronsUpDown : sort.order === 'asc' ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      aria-sort={isActive ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
      title={`Сортувати за «${label}» ${order === 'asc' ? 'за зростанням' : 'за спаданням'}`}
      onClick={() => onSortChange({ field: sortKey, order })}
      className={cn(
        'group hover:text-foreground flex min-w-0 cursor-pointer items-center gap-1 transition-colors',
        align === 'right' && 'justify-end',
        isActive && 'text-foreground',
      )}
    >
      <span className="truncate">{label}</span>
      <Icon
        className={cn(
          'size-3 shrink-0 transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
        )}
      />
    </button>
  );
};
