import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';
import {
  PeopleFilters,
  PeoplePagination,
  PeopleStats,
  PeopleTable,
  PersonDialog,
  PERSON_STATUS_LABELS,
  exportPeopleToCsv,
  peopleQueryOptions,
  peopleSearchSchema,
  toPeopleQuery,
  usePeople,
  usePeopleOptions,
  usePeopleStats,
  type PeopleSearch,
} from '@/modules/people';
import { PersonService } from '@/services';

export const Route = createFileRoute('/_app/people/')({
  validateSearch: (search: Record<string, unknown>): PeopleSearch => {
    const parsed = peopleSearchSchema.safeParse(search);

    // A hand-edited URL falls back to the default view instead of erroring.
    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  /**
   * Deliberately not awaited. Awaiting here holds the navigation until the rows
   * arrive, so `useSearch()` — and with it the active status pill — only updates
   * once the request comes back. Firing and forgetting lets the URL commit at
   * once: the pill moves immediately and `usePeople` keeps the previous page on
   * screen while the new one loads.
   */
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(peopleQueryOptions(toPeopleQuery(deps)));
  },
  component: PeoplePage,
});

function PeoplePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const query = toPeopleQuery(search);
  const { data: page, isPending, isFetching, error } = usePeople(query);
  const { data: stats } = usePeopleStats();
  const { data: options } = usePeopleOptions();

  // The input is local and the request is debounced, so typing stays smooth.
  const [queryText, setQueryText] = useState(search.q ?? '');
  const debouncedQuery = useDebouncedValue(queryText);

  const [isExporting, setIsExporting] = useState(false);

  const patchSearch = (patch: Partial<PeopleSearch>) =>
    void navigate({
      search: (current) => {
        const next = { ...current, ...patch };

        // Any filter change invalidates the current page number.
        if (!('page' in patch)) delete next.page;

        return next;
      },
      replace: true,
    });

  useEffect(() => {
    const next = debouncedQuery.trim();

    if (next === (search.q ?? '')) return;

    patchSearch({ q: next || undefined });
    // patchSearch is recreated every render; the debounced value is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const filterSummary =
    [search.status ? PERSON_STATUS_LABELS[search.status] : null, search.community, search.ministry]
      .filter(Boolean)
      .join(' · ') || 'Без додаткових фільтрів';

  const onExport = async () => {
    setIsExporting(true);

    try {
      // Exports every match, not just the page on screen.
      const all = await PersonService.listAll(query);

      exportPeopleToCsv(all);
    } catch (exportError) {
      toast.error(getApiErrorMessage(exportError, 'Не вдалося експортувати'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Спільнота"
        title="Люди"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void onExport()}
              disabled={isExporting || !page?.total}
            >
              {isExporting ? 'Готуємо…' : 'Експорт'}
            </Button>

            <PersonDialog>
              <Button>Додати людину</Button>
            </PersonDialog>
          </>
        }
      />

      <PeopleStats stats={stats} />

      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <PeopleFilters
          filters={search}
          query={queryText}
          groupOptions={options?.communities ?? []}
          ministryOptions={options?.ministries ?? []}
          onQueryChange={setQueryText}
          onChange={patchSearch}
          onReset={() => {
            setQueryText('');
            void navigate({ search: {}, replace: true });
          }}
        />

        <div className="bg-secondary border-border-muted flex items-center justify-between gap-4 border-b px-5 py-2.75">
          {/* The total comes from the previous page while the next one loads, so it
              is dimmed alongside the rows rather than posing as the new count. */}
          <span
            className={cn(
              'text-ink-soft text-xs transition-opacity',
              isFetching && !isPending && 'opacity-60',
            )}
          >
            {page ? `${page.total} ${page.total === 1 ? 'людина' : 'людей'}` : '…'}
            {isFetching && !isPending ? ' · оновлюємо' : ''}
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
        ) : page.items.length === 0 ? (
          <div className="flex flex-col gap-2 px-5 py-13.5 text-center">
            <span className="text-[15px]">Нікого не знайдено</span>
            <span className="text-ink-faint text-[13px]">
              {page.total === 0 && !search.q && !search.status
                ? 'Додайте першу людину — і вона зʼявиться в цьому списку.'
                : 'Спробуйте змінити фільтри або пошуковий запит.'}
            </span>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'overflow-x-auto transition-opacity',
                isFetching && 'pointer-events-none opacity-60',
              )}
            >
              <PeopleTable people={page.items} />
            </div>

            <PeoplePagination
              page={page.page}
              pages={page.pages}
              total={page.total}
              limit={page.limit}
              onPageChange={(next) => patchSearch({ page: next === 1 ? undefined : next })}
            />
          </>
        )}
      </section>
    </>
  );
}
