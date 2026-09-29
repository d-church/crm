import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { AttendanceStatus, gatheringScope, gatheringTitle, getPersonName } from '@/services';
import type { Gathering } from '@/services';

import { useAttendance } from './hooks';

/**
 * Зібрання списком: дата, подія, скільки було. Кількість розгортається в імена —
 * питання «а хто саме був» виникає одразу після «скільки», і заради нього не варто
 * йти на іншу сторінку.
 */
export const GatheringList = ({ gatherings }: { gatherings: Gathering[] }) =>
  gatherings.length === 0 ? (
    <p className="text-ink-faint text-[13px]">Цього місяця зібрань немає</p>
  ) : (
    <ul className="grid gap-2">
      {gatherings.map((gathering) => (
        <GatheringRow key={gathering.id} gathering={gathering} />
      ))}
    </ul>
  );

const GatheringRow = ({ gathering }: { gathering: Gathering }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Імена тягнемо лише коли рядок розгорнули: у списку їх ніхто не читає.
  const { data: marks = [], isPending } = useAttendance(gathering.id, isOpen);

  const present = gathering.presentCount ?? 0;
  const marked = gathering._count.attendances;

  return (
    <li className="bg-card border-border-muted rounded-xl border">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
        <span className="text-ink-soft w-20 shrink-0 text-[12.5px] tabular-nums">
          {new Date(gathering.startsAt).toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
          })}
        </span>

        <Link
          to="/gatherings/$gatheringId"
          params={{ gatheringId: gathering.id }}
          className="min-w-0 flex-1 text-[14px] underline-offset-3 hover:underline"
        >
          {gatheringTitle(gathering)}
          <span className="text-ink-faint ml-2 text-[12px]">{gatheringScope(gathering)}</span>
        </Link>

        {marked === 0 ? (
          <span className="text-destructive text-[12px]">не відмічено</span>
        ) : (
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="text-ink flex cursor-pointer items-center gap-1 text-[13px] hover:underline"
          >
            {present} {plural(present)}
            <ChevronDown className={cn('size-3.5 transition-transform', isOpen && 'rotate-180')} />
          </button>
        )}
      </div>

      {isOpen ? (
        <div className="border-border-subtle border-t px-4 py-3">
          {isPending ? <Skeleton className="h-5" /> : <Attendees marks={marks} />}
        </div>
      ) : null}
    </li>
  );
};

const Attendees = ({
  marks,
}: {
  marks: { id: string; firstName: string; lastName: string | null; status: AttendanceStatus }[];
}) => {
  const present = marks.filter(({ status }) => status === AttendanceStatus.PRESENT);
  const absent = marks.filter(({ status }) => status === AttendanceStatus.ABSENT);

  if (marks.length === 0) {
    return <p className="text-ink-faint text-[12.5px]">Серед видимих вам людей відміток немає</p>;
  }

  return (
    <div className="grid gap-2">
      <Names title="Були" people={present} />
      {/* Відсутні потрібні не менше: саме з них починається розмова про те, кого давно не видно. */}
      {absent.length > 0 ? <Names title="Не були" people={absent} muted /> : null}
    </div>
  );
};

const Names = ({
  title,
  people,
  muted = false,
}: {
  title: string;
  people: { id: string; firstName: string; lastName: string | null }[];
  muted?: boolean;
}) =>
  people.length === 0 ? null : (
    <div className="grid gap-0.5">
      <span className="text-ink-faint text-[11.5px]">
        {title} · {people.length}
      </span>
      <ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <li key={person.id} className={cn('truncate text-[13px]', muted && 'text-ink-faint')}>
            <Link
              to="/people/$personId"
              params={{ personId: person.id }}
              className="underline-offset-3 hover:underline"
            >
              {getPersonName(person)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

const plural = (count: number) => {
  const tail = count % 10;
  const teen = count % 100;

  if (teen >= 11 && teen <= 14) return 'людей';

  return tail === 1 ? 'людина' : tail >= 2 && tail <= 4 ? 'людини' : 'людей';
};
