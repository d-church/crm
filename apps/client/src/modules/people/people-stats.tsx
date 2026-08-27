import { Skeleton } from '@/components/ui';
import type { PeopleStats as PeopleStatsData } from '@/services';

type Stat = { label: string; value: number; note: string };

/** The API counts these over the whole base, so paging never changes them. */
const buildStats = (stats: PeopleStatsData): Stat[] => [
  { label: 'Усього в базі', value: stats.total, note: 'від гостей до служителів' },
  { label: 'У спільноті', value: stats.inCommunity, note: 'включно зі служителями' },
  { label: 'Нові за місяць', value: stats.newThisMonth, note: 'потребують контакту' },
  { label: 'Потребують дії', value: stats.needsAction, note: 'опіка або протермінована дія' },
];

const PLACEHOLDERS = ['Усього в базі', 'У спільноті', 'Нові за місяць', 'Потребують дії'] as const;

export const PeopleStats = ({ stats }: { stats?: PeopleStatsData }) => (
  <section className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
    {stats
      ? buildStats(stats).map(({ label, value, note }) => (
          <div key={label} className="bg-card flex flex-col gap-1.25 px-5 py-4.5">
            <span className="eyebrow text-muted-foreground">{label}</span>
            <span className="text-[26px] leading-tight tabular-nums">{value}</span>
            <span className="text-ink-faint text-[11.5px]">{note}</span>
          </div>
        ))
      : PLACEHOLDERS.map((label) => (
          <div key={label} className="bg-card flex flex-col gap-1.25 px-5 py-4.5">
            <span className="eyebrow text-muted-foreground">{label}</span>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
  </section>
);
