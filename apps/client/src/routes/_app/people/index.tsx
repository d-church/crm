import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  AddPersonDialog,
  DEFAULT_FILTERS,
  PeopleFilters,
  PeopleStats,
  PeopleTable,
  PERSON_STATUS_LABELS,
  ANY,
  collectOptions,
  exportPeopleToCsv,
  filterPeople,
  peopleQueryOptions,
  usePeople,
  type PeopleFilterState,
} from '@/modules/people';

export const Route = createFileRoute('/_app/people/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(peopleQueryOptions()),
  component: PeoplePage,
});

function PeoplePage() {
  const { data: people, isPending, error } = usePeople();
  const [filters, setFilters] = useState<PeopleFilterState>(DEFAULT_FILTERS);

  const all = useMemo(() => people ?? [], [people]);
  const visible = useMemo(() => filterPeople(all, filters), [all, filters]);

  const groupOptions = useMemo(() => collectOptions(all, 'smallGroup'), [all]);
  const ministryOptions = useMemo(() => collectOptions(all, 'ministry'), [all]);

  const filterSummary =
    [
      filters.status === ANY ? null : PERSON_STATUS_LABELS[filters.status],
      filters.group === ANY ? null : filters.group,
      filters.ministry === ANY ? null : filters.ministry,
    ]
      .filter(Boolean)
      .join(' · ') || 'Без додаткових фільтрів';

  const patchFilters = (patch: Partial<PeopleFilterState>) =>
    setFilters((current) => ({ ...current, ...patch }));

  return (
    <>
      <PageHeader
        eyebrow="Спільнота"
        title="Люди"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => exportPeopleToCsv(visible)}
              disabled={visible.length === 0}
            >
              Експорт
            </Button>

            <AddPersonDialog>
              <Button>Додати людину</Button>
            </AddPersonDialog>
          </>
        }
      />

      <PeopleStats people={all} />

      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <PeopleFilters
          filters={filters}
          groupOptions={groupOptions}
          ministryOptions={ministryOptions}
          onChange={patchFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="bg-secondary border-border-muted flex items-center justify-between gap-4 border-b px-5 py-2.75">
          <span className="text-ink-soft text-xs">
            {visible.length} з {all.length} людей
          </span>
          <span className="text-ink-faint text-xs">{filterSummary}</span>
        </div>

        {error ? (
          <p className="text-destructive p-6 text-sm">{getApiErrorMessage(error)}</p>
        ) : isPending ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col gap-2 px-5 py-13.5 text-center">
            <span className="text-[15px]">Нікого не знайдено</span>
            <span className="text-ink-faint text-[13px]">
              {all.length === 0
                ? 'Додайте першу людину — і вона зʼявиться в цьому списку.'
                : 'Спробуйте змінити фільтри або пошуковий запит.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <PeopleTable people={visible} />
          </div>
        )}
      </section>
    </>
  );
}
