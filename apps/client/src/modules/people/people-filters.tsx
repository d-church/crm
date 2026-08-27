import { Input, Select } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PeopleSort, PersonStatus } from '@/services';

import { ANY, DEFAULT_SORT, SORT_LABELS, type PeopleSearch } from './filtering';
import { PERSON_STATUSES, PERSON_STATUS_LABELS } from './status';

type PeopleFiltersProps = {
  filters: PeopleSearch;
  /** Local, so typing stays responsive while the request is debounced. */
  query: string;
  groupOptions: string[];
  ministryOptions: string[];
  onQueryChange: (query: string) => void;
  onChange: (patch: Partial<PeopleSearch>) => void;
  onReset: () => void;
};

export const PeopleFilters = ({
  filters,
  query,
  groupOptions,
  ministryOptions,
  onQueryChange,
  onChange,
  onReset,
}: PeopleFiltersProps) => (
  <div className="border-border-muted flex flex-col gap-3.25 border-b p-5">
    <div className="flex flex-wrap items-center gap-2.5">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Пошук за іменем, телефоном"
        aria-label="Пошук людей"
        className="min-w-[250px] flex-1"
      />

      <Select
        value={filters.community ?? ANY}
        onChange={(event) =>
          onChange({
            community: event.target.value === ANY ? undefined : event.target.value,
          })
        }
        aria-label="Мала група"
      >
        <option value={ANY}>Усі групи</option>
        {groupOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Select
        value={filters.ministry ?? ANY}
        onChange={(event) =>
          onChange({ ministry: event.target.value === ANY ? undefined : event.target.value })
        }
        aria-label="Служіння"
      >
        <option value={ANY}>Усі служіння</option>
        {ministryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <Select
        value={filters.sort ?? DEFAULT_SORT}
        onChange={(event) => onChange({ sort: event.target.value as PeopleSort })}
        aria-label="Сортування"
      >
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {[ANY, ...PERSON_STATUSES].map((status) => {
        const isActive = (filters.status ?? ANY) === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() =>
              onChange({ status: status === ANY ? undefined : (status as PersonStatus) })
            }
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.75 text-[12.5px] font-light transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input-border bg-card text-ink hover:border-foreground',
            )}
          >
            {status === ANY ? 'Усі статуси' : PERSON_STATUS_LABELS[status as PersonStatus]}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onReset}
        className="text-muted-foreground hover:text-foreground ml-auto cursor-pointer text-[12.5px] underline underline-offset-3 transition-colors"
      >
        Скинути фільтри
      </button>
    </div>
  </div>
);
