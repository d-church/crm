import { X } from 'lucide-react';

import type { PeopleFilter } from '@/services';

import { describeCondition, type FilterOptionSources } from './filter-fields';

type PeopleFilterChipsProps = {
  filter: PeopleFilter;
  sources: FilterOptionSources;
  /** Opens the builder — a chip is edited there, with the rest in view. */
  onEdit: () => void;
  onChange: (filter: PeopleFilter | undefined) => void;
};

/** The applied conditions, readable at a glance and removable one by one. */
export const PeopleFilterChips = ({
  filter,
  sources,
  onEdit,
  onChange,
}: PeopleFilterChipsProps) => {
  const removeAt = (index: number) => {
    const conditions = filter.conditions.filter((_, position) => position !== index);

    onChange(conditions.length > 0 ? { ...filter, conditions } : undefined);
  };

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Умови фільтра">
      {filter.conditions.map((condition, index) => {
        const description = describeCondition(condition, sources);

        return (
          <li key={`${index}-${description}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-ink-faint text-[11.5px]">
                {filter.match === 'all' ? 'і' : 'або'}
              </span>
            ) : null}
            <span className="border-primary/30 bg-primary/5 text-ink flex max-w-full items-center rounded-full border text-[12.5px]">
              <button
                type="button"
                onClick={onEdit}
                title="Змінити умови"
                className="min-w-0 cursor-pointer truncate py-1 pr-1 pl-3 text-left"
              >
                {description}
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={`Прибрати умову: ${description}`}
                className="text-ink-faint hover:text-destructive grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
};
