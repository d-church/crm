import { Columns3, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PeopleFilter } from '@/services';

import type { FilterOptionSources } from './filter-fields';
import type { PeopleSearch } from './filtering';
import { PeopleFilterChips } from './people-filter-chips';
import { SavedFiltersBar } from './saved-filters-bar';

type PeopleFiltersProps = {
  filters: PeopleSearch;
  /** Local, so typing stays responsive while the request is debounced. */
  query: string;
  sources: FilterOptionSources;
  onQueryChange: (query: string) => void;
  onChange: (patch: Partial<PeopleSearch>) => void;
  onOpenBuilder: () => void;
  onOpenColumns: () => void;
  onReset: () => void;
};

export const PeopleFilters = ({
  filters,
  query,
  sources,
  onQueryChange,
  onChange,
  onOpenBuilder,
  onOpenColumns,
  onReset,
}: PeopleFiltersProps) => {
  const conditionCount = filters.filter?.conditions.length ?? 0;

  return (
    <div className="border-border-muted flex flex-col gap-3.25 border-b p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Пошук за іменем, телефоном"
          aria-label="Пошук людей"
          className="min-w-[250px] flex-1"
        />

        <button
          type="button"
          onClick={onOpenBuilder}
          aria-haspopup="dialog"
          className={cn(
            'flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-[13.5px] transition-colors',
            conditionCount > 0
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-input-border bg-input text-foreground hover:border-foreground',
          )}
        >
          <SlidersHorizontal className="size-4" />
          Фільтр
          {conditionCount > 0 ? (
            <span className="bg-primary text-primary-foreground grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5">
              {conditionCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onOpenColumns}
          aria-haspopup="dialog"
          className="border-input-border bg-input text-foreground hover:border-foreground flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-[13.5px] transition-colors"
        >
          <Columns3 className="size-4" />
          Стовпці
        </button>
      </div>

      <SavedFiltersBar current={filters.filter} onApply={(filter) => onChange({ filter })} />

      {filters.filter ? (
        <PeopleFilterChips
          filter={filters.filter}
          sources={sources}
          onEdit={onOpenBuilder}
          onChange={(filter: PeopleFilter | undefined) => onChange({ filter })}
        />
      ) : null}

      <div className="flex">
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
};
