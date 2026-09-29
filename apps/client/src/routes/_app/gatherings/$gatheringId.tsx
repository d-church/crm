import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Check, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { Button, Input, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useGathering,
  useMarkAttendance,
  useRemoveGathering,
  useRoster,
} from '@/modules/gatherings';
import {
  AttendanceStatus,
  gatheringScope,
  gatheringTitle,
  getPersonName,
  type RosterEntry,
} from '@/services';

export const Route = createFileRoute('/_app/gatherings/$gatheringId')({
  component: GatheringPage,
});

/**
 * Відмічання присутності. Список — це ті, кого користувачу видно: свої люди плюс
 * він сам. Правки тримаються локально й ідуть одним запитом: лідер проставляє
 * галочки по всій групі, а тоді зберігає.
 */
function GatheringPage() {
  const { gatheringId } = Route.useParams();
  const navigate = useNavigate();
  const { data: gathering, isPending, error } = useGathering(gatheringId);
  const { data: roster = [], isPending: isRosterPending } = useRoster(gatheringId);
  const { mark, isPending: isSaving } = useMarkAttendance(gatheringId);
  const { removeGathering } = useRemoveGathering();

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLocaleLowerCase('uk-UA');
  const visible = useMemo(
    () =>
      roster.filter((entry) =>
        getPersonName(entry).toLocaleLowerCase('uk-UA').includes(normalized),
      ),
    [roster, normalized],
  );

  const statusOf = (entry: RosterEntry) => draft[entry.id] ?? entry.status;
  const changed = Object.entries(draft).filter(
    ([id, status]) => roster.find((entry) => entry.id === id)?.status !== status,
  );

  const counts = roster.reduce(
    (totals, entry) => {
      const status = statusOf(entry);

      if (status === AttendanceStatus.PRESENT) totals.present += 1;
      else if (status === AttendanceStatus.ABSENT) totals.absent += 1;
      else totals.unknown += 1;

      return totals;
    },
    { present: 0, absent: 0, unknown: 0 },
  );

  const set = (id: string, status: AttendanceStatus) =>
    setDraft((current) => ({ ...current, [id]: status }));

  const markAll = (status: AttendanceStatus) =>
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(visible.map((entry) => [entry.id, status])),
    }));

  const save = async () => {
    try {
      const { saved } = await mark(changed.map(([personId, status]) => ({ personId, status })));

      setDraft({});
      toast.success(`Збережено відміток: ${saved}`);
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, 'Не вдалося зберегти'));
    }
  };

  const remove = async () => {
    try {
      await removeGathering(gatheringId);
      toast.success('Зібрання прибрано');
      await navigate({ to: '/calendar' });
    } catch (removeError) {
      toast.error(getApiErrorMessage(removeError, 'Не вдалося прибрати'));
    }
  };

  if (error) return <p className="text-destructive text-[13px]">{getApiErrorMessage(error)}</p>;
  if (isPending || !gathering) return <Skeleton className="h-48" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/calendar" className="hover:text-foreground hover:underline">
            Календар
          </Link>
        }
        title={gatheringTitle(gathering)}
        description={`${gatheringScope(gathering)} · ${new Date(gathering.startsAt).toLocaleString(
          'uk-UA',
          { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' },
        )}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/calendar">
                <ArrowLeft />
                До календаря
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              onClick={() => void remove()}
            >
              <Trash2 />
              Прибрати
            </Button>
          </>
        }
      />

      <section className="bg-card border-border-muted rounded-xl border">
        <div className="border-border-subtle flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <span className="text-[12.5px]">
            Був: <b>{counts.present}</b>
          </span>
          <span className="text-ink-soft text-[12.5px]">
            Не був: <b>{counts.absent}</b>
          </span>
          {/* Невідмічені — це не «не був», тому рахуємо їх окремо. */}
          <span className="text-ink-faint text-[12.5px]">Не відмічено: {counts.unknown}</span>

          <div className="relative ml-auto min-w-[12rem] flex-1">
            <Search className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              placeholder="Пошук людини"
              aria-label="Пошук людини"
              className="h-9 pl-9 text-[13px]"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="border-border-subtle flex flex-wrap gap-2 border-b px-4 py-2">
          <button
            type="button"
            onClick={() => markAll(AttendanceStatus.PRESENT)}
            className="text-ink-faint hover:text-foreground cursor-pointer text-[12px] transition-colors"
          >
            Усі були
          </button>
          <button
            type="button"
            onClick={() => markAll(AttendanceStatus.ABSENT)}
            className="text-ink-faint hover:text-foreground cursor-pointer text-[12px] transition-colors"
          >
            Усі не були
          </button>
        </div>

        {isRosterPending ? (
          <div className="grid gap-2 p-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-ink-faint px-4 py-6 text-[13px]">
            {roster.length === 0 ? 'Тут нікого відмічати' : 'Нікого не знайдено'}
          </p>
        ) : (
          <ul className="divide-border-subtle divide-y">
            {visible.map((entry) => {
              const status = statusOf(entry);

              return (
                <li key={entry.id} className="flex items-center gap-2 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">
                    {getPersonName(entry)}
                  </span>

                  <StatusButton
                    active={status === AttendanceStatus.PRESENT}
                    tone="present"
                    label={`Був: ${getPersonName(entry)}`}
                    onClick={() => set(entry.id, AttendanceStatus.PRESENT)}
                  >
                    <Check className="size-4" />
                  </StatusButton>

                  <StatusButton
                    active={status === AttendanceStatus.ABSENT}
                    tone="absent"
                    label={`Не був: ${getPersonName(entry)}`}
                    onClick={() => set(entry.id, AttendanceStatus.ABSENT)}
                  >
                    <X className="size-4" />
                  </StatusButton>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-border-subtle flex items-center gap-3 border-t px-4 py-3">
          <span className="text-ink-faint text-[12px]">
            {changed.length === 0 ? 'Змін немає' : `Змінено: ${changed.length}`}
          </span>
          <Button
            type="button"
            className="ml-auto"
            disabled={changed.length === 0 || isSaving}
            onClick={() => void save()}
          >
            {isSaving ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        </div>
      </section>
    </>
  );
}

const StatusButton = ({
  active,
  tone,
  label,
  onClick,
  children,
}: {
  active: boolean;
  tone: 'present' | 'absent';
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border transition-colors',
      active
        ? tone === 'present'
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-destructive text-destructive'
        : 'border-border-muted text-ink-faint hover:text-foreground',
    )}
  >
    {children}
  </button>
);
