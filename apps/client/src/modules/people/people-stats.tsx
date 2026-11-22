import { Link } from '@tanstack/react-router';
import { ArrowDownRight } from 'lucide-react';

import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PeopleStatFilter, PeopleStats as PeopleStatsData } from '@/services';

import { PEOPLE_RESULTS_ID, PEOPLE_STAT_LABELS, type PeopleSearch } from './filtering';

type Stat = { label: string; value: number; note: string; stat?: PeopleStatFilter };

/** The API counts these over the whole base, so paging never changes them. */
const buildStats = (stats: PeopleStatsData, includeInactive: boolean): Stat[] => [
  {
    label: includeInactive ? 'Усього в базі' : 'Активних у базі',
    value: stats.total,
    note: includeInactive ? 'разом із неактивними' : 'без неактивних',
  },
  { label: 'У спільноті', value: stats.inCommunity, note: 'включно зі служителями' },
  {
    label: PEOPLE_STAT_LABELS.newThisMonth,
    value: stats.newThisMonth,
    note: 'додані за останні 30 днів',
    stat: 'newThisMonth',
  },
  {
    label: PEOPLE_STAT_LABELS.needsAction,
    value: stats.needsAction,
    note: 'опіка або прострочений крок',
    stat: 'needsAction',
  },
];

const PLACEHOLDERS = [
  'Активних у базі',
  'У спільноті',
  PEOPLE_STAT_LABELS.newThisMonth,
  PEOPLE_STAT_LABELS.needsAction,
] as const;

const CARD = 'bg-card flex flex-col gap-1.25 px-5 py-4.5';

export const PeopleStats = ({
  stats,
  search,
}: {
  stats?: PeopleStatsData;
  search: PeopleSearch;
}) => (
  <section className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
    {stats
      ? buildStats(stats, search.includeInactive ?? false).map(({ label, value, note, stat }) => {
          const content = (
            <>
              <span className="eyebrow text-muted-foreground">{label}</span>
              <span className="text-[26px] leading-tight tabular-nums">{value}</span>
              <span className="text-ink-faint text-[11.5px]">{note}</span>
            </>
          );

          return stat ? (
            <Link
              key={stat}
              to="/people"
              search={{
                stat,
                segment: search.segment,
                includeInactive: search.includeInactive,
                sort: search.sort,
                order: search.order,
              }}
              hash={PEOPLE_RESULTS_ID}
              className={cn(
                CARD,
                'hover:bg-secondary focus-visible:outline-primary relative pr-11 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
                search.stat === stat && 'bg-secondary',
              )}
            >
              {content}
              <ArrowDownRight
                aria-hidden="true"
                className="text-primary absolute top-4.5 right-5 size-4"
              />
            </Link>
          ) : (
            <div key={label} className={CARD}>
              {content}
            </div>
          );
        })
      : PLACEHOLDERS.map((label) => (
          <div key={label} className={CARD}>
            <span className="eyebrow text-muted-foreground">{label}</span>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
  </section>
);
