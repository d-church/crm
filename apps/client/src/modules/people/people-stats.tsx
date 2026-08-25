import { PersonStatus, type Person } from '@/services';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

type Stat = { label: string; value: number; note: string };

const buildStats = (people: Person[]): Stat[] => {
  const count = (status: PersonStatus) => people.filter((p) => p.status === status).length;
  const recentlyAdded = people.filter(
    (person) => Date.now() - Date.parse(person.createdAt) < MONTH_MS,
  ).length;

  return [
    { label: 'Усього в базі', value: people.length, note: 'гості, члени та служителі' },
    {
      label: 'Активні члени',
      value: count(PersonStatus.MEMBER) + count(PersonStatus.SERVANT),
      note: 'включно зі служителями',
    },
    { label: 'Нові за місяць', value: recentlyAdded, note: 'потребують контакту' },
    {
      label: 'Без групи',
      value: people.filter((person) => !person.smallGroup).length,
      note: 'запросити в малу групу',
    },
  ];
};

export const PeopleStats = ({ people }: { people: Person[] }) => (
  <section className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
    {buildStats(people).map(({ label, value, note }) => (
      <div key={label} className="bg-card flex flex-col gap-1.25 px-5 py-4.5">
        <span className="eyebrow text-muted-foreground">{label}</span>
        <span className="text-[26px] leading-tight tabular-nums">{value}</span>
        <span className="text-ink-faint text-[11.5px]">{note}</span>
      </div>
    ))}
  </section>
);
