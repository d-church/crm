import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PeopleFilter, PeopleFilterField, PeopleFilterOperator } from '@/services';

import {
  createDraft,
  FILTER_FIELD_GROUPS,
  FILTER_FIELDS,
  getFilterField,
  getOperatorLabel,
  getOperators,
  MAX_FILTER_CONDITIONS,
  toCondition,
  toDraft,
  type ConditionDraft,
  type FilterOptionSources,
} from './filter-fields';
import { FilterValueInput } from './filter-value-input';

type PeopleFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: PeopleFilter | undefined;
  sources: FilterOptionSources;
  onApply: (filter: PeopleFilter | undefined) => void;
};

export const PeopleFilterDialog = ({
  open,
  onOpenChange,
  filter,
  sources,
  onApply,
}: PeopleFilterDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {/* On a phone the builder rises from the bottom edge like a sheet. */}
    <DialogContent
      className={cn(
        'max-w-2xl gap-4',
        'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:p-5',
      )}
    >
      {/* Mounted only while open, so every opening starts from the applied filter. */}
      <FilterBuilder
        filter={filter}
        sources={sources}
        onApply={(next) => {
          onApply(next);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);

type FilterBuilderProps = {
  filter: PeopleFilter | undefined;
  sources: FilterOptionSources;
  onApply: (filter: PeopleFilter | undefined) => void;
  onCancel: () => void;
};

const FilterBuilder = ({ filter, sources, onApply, onCancel }: FilterBuilderProps) => {
  const [match, setMatch] = useState<PeopleFilter['match']>(filter?.match ?? 'all');
  const [drafts, setDrafts] = useState<ConditionDraft[]>(() =>
    filter?.conditions.length ? filter.conditions.map(toDraft) : [createDraft()],
  );

  const conditions = drafts.map(toCondition);
  const isComplete = conditions.every((condition) => condition !== null);

  const update = (key: string, patch: Partial<ConditionDraft>) =>
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );

  const changeField = (key: string, field: PeopleFilterField) =>
    // A value for one field rarely means anything for another, so the row restarts.
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...createDraft(field), key } : draft)),
    );

  const changeOperator = (draft: ConditionDraft, operator: PeopleFilterOperator) => {
    const sameInput =
      getFilterField(draft.field).kind !== 'date' ||
      isRelative(draft.operator) === isRelative(operator);

    // Days typed for "за останні N днів" are not a date, so the value only survives
    // a switch between operators that read it the same way.
    update(draft.key, sameInput ? { operator } : { operator, text: '', range: ['', ''] });
  };

  const remove = (key: string) =>
    setDrafts((current) => current.filter((draft) => draft.key !== key));

  const apply = () => {
    const complete = conditions.filter((condition) => condition !== null);

    onApply(complete.length > 0 ? { match, conditions: complete } : undefined);
  };

  return (
    <>
      <DialogHeader className="pr-8">
        <DialogTitle>Фільтр</DialogTitle>
        <DialogDescription>Умови поєднуються з пошуком і статусом над списком.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="text-ink-soft">Показати людей, що відповідають</span>
        <div
          role="radiogroup"
          aria-label="Як поєднувати умови"
          className="border-input-border inline-flex rounded-full border p-0.5"
        >
          {(
            [
              ['all', 'усім умовам'],
              ['any', 'будь-якій умові'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={match === value}
              onClick={() => setMatch(value)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-[12.5px] transition-colors',
                match === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-ink hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="grid gap-2.5">
        {drafts.map((draft, index) => (
          <li
            key={draft.key}
            className="border-border-muted bg-secondary/50 grid gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-ink-faint w-9 shrink-0 text-[11.5px]">
                {index === 0 ? 'Де' : match === 'all' ? 'і' : 'або'}
              </span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <Select
                  value={draft.field}
                  aria-label={`Умова ${index + 1}: поле`}
                  className="h-10 w-full min-w-0"
                  onChange={(event) =>
                    changeField(draft.key, event.target.value as PeopleFilterField)
                  }
                >
                  {FILTER_FIELD_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {FILTER_FIELDS.filter((field) => field.group === group).map((field) => (
                        <option key={field.field} value={field.field}>
                          {field.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                <Select
                  value={draft.operator}
                  aria-label={`Умова ${index + 1}: оператор`}
                  className="h-10 w-full min-w-0"
                  onChange={(event) =>
                    changeOperator(draft, event.target.value as PeopleFilterOperator)
                  }
                >
                  {getOperators(draft.field).map((operator) => (
                    <option key={operator} value={operator}>
                      {getOperatorLabel(draft.field, operator)}
                    </option>
                  ))}
                </Select>
              </div>
              <button
                type="button"
                title="Прибрати умову"
                aria-label={`Прибрати умову ${index + 1}`}
                disabled={drafts.length === 1}
                onClick={() => remove(draft.key)}
                className="text-ink-faint hover:text-destructive grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors disabled:cursor-default disabled:opacity-30 disabled:hover:text-inherit"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="sm:pr-11 sm:pl-11">
              <FilterValueInput
                draft={draft}
                sources={sources}
                onChange={(patch) => update(draft.key, patch)}
              />
            </div>
          </li>
        ))}
      </ol>

      {drafts.length < MAX_FILTER_CONDITIONS ? (
        <button
          type="button"
          onClick={() => setDrafts((current) => [...current, createDraft()])}
          className="border-input-border text-ink hover:border-foreground hover:text-foreground flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-[13px] transition-colors"
        >
          <Plus className="size-4" />
          Додати умову
        </button>
      ) : null}

      <DialogFooter className="border-border-muted border-t pt-4">
        <Button
          type="button"
          variant="link"
          size="text"
          className="text-muted-foreground mr-auto"
          onClick={() => onApply(undefined)}
        >
          Скинути фільтр
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="button" disabled={!isComplete} onClick={apply}>
          Застосувати
        </Button>
      </DialogFooter>
    </>
  );
};

const isRelative = (operator: PeopleFilterOperator) =>
  operator === 'withinLastDays' || operator === 'moreThanDaysAgo' || operator === 'withinNextDays';
