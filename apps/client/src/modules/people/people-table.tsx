import { Link } from '@tanstack/react-router';

import { formatDayMonth, getInitials } from '@/lib/format';
import { getPersonName, type Person } from '@/services';

import { getPersonMeta } from './filtering';
import { PersonStatusBadge } from './person-status-badge';

/** One grid template drives both the header and the rows. */
const COLUMNS = 'grid grid-cols-[2.1fr_1.1fr_1.3fr_1.2fr_.9fr_.8fr] gap-4 px-5';

export const PeopleTable = ({ people }: { people: Person[] }) => (
  <div className="min-w-[880px]">
    <div className={`${COLUMNS} eyebrow text-muted-foreground border-border-muted border-b py-3`}>
      <span>Імʼя</span>
      <span>Статус</span>
      <span>Спільнота</span>
      <span>Служіння</span>
      <span>Остання зустріч</span>
      <span className="text-right">Контакт</span>
    </div>

    {people.map((person) => {
      const name = getPersonName(person);
      const meta = getPersonMeta(person);

      return (
        <div
          key={person.id}
          className={`${COLUMNS} border-border-subtle hover:bg-accent items-center border-b py-3.25 transition-colors`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 flex-none place-items-center rounded-full bg-[#e6ece5] text-[11.5px] text-[#3f4a43]">
              {getInitials(name)}
            </span>

            <span className="flex min-w-0 flex-col">
              <Link
                to="/people/$personId"
                params={{ personId: person.id }}
                className="text-foreground truncate text-[13.5px] underline-offset-3 hover:underline"
              >
                {name}
              </Link>
              {meta ? <span className="text-ink-faint text-[11.5px]">{meta}</span> : null}
            </span>
          </div>

          <PersonStatusBadge status={person.status} className="justify-self-start" />

          <span className="text-ink truncate text-[13px]">{person.community ?? 'ще немає'}</span>
          <span className="text-ink truncate text-[13px]">{person.ministry ?? '—'}</span>
          <span className="text-ink-soft text-[13px] tabular-nums">
            {person.lastSeenAt ? formatDayMonth(person.lastSeenAt) : '—'}
          </span>
          <span className="text-ink-soft truncate text-right text-[12.5px] tabular-nums">
            {person.phone ?? '—'}
          </span>
        </div>
      );
    })}
  </div>
);
