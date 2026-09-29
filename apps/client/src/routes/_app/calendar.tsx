import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth';
import {
  CreateGatheringDialog,
  GatheringList,
  MONTH_NAMES,
  toDayKey,
  toMonthRange,
} from '@/modules/gatherings';
import { gatheringTitle, GatheringService, UserRole } from '@/services';

export const Route = createFileRoute('/_app/calendar')({
  component: CalendarPage,
});

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/**
 * Календар зібрань. Місяць — щоб бачити ритм, список під ним — щоб не вгадувати,
 * що саме за крапкою в клітинці.
 */
function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [month, setMonth] = useState(() => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { from, to, days, leadingBlanks } = toMonthRange(month);
  const {
    data: gatherings = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ['gatherings', from, to] as const,
    queryFn: () => GatheringService.findAll(from, to),
  });

  const roles = user?.roles?.length ? user.roles : user ? [user.role] : [];
  const mayCreate = roles.some(
    (role) => role === UserRole.SUPERADMIN || role === UserRole.ADMIN || role === UserRole.LEADER,
  );

  const byDay = new Map<string, typeof gatherings>();

  for (const gathering of gatherings) {
    const key = toDayKey(new Date(gathering.startsAt));

    byDay.set(key, [...(byDay.get(key) ?? []), gathering]);
  }

  const shift = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <>
      <PageHeader
        eyebrow="Церква"
        title="Календар"
        description="Зібрання, які вам видно. Відкрийте будь-яке, щоб відмітити присутніх."
        actions={
          mayCreate ? (
            <CreateGatheringDialog onCreated={() => void refetch()}>
              <Button>
                <CalendarPlus />
                Додати зібрання
              </Button>
            </CreateGatheringDialog>
          ) : null
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Попередній місяць"
          onClick={() => shift(-1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-44 text-center text-[14px]">
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Наступний місяць"
          onClick={() => shift(1)}
        >
          <ChevronRight />
        </Button>

        {/* Сітка показує ритм, список — деталі. Потрібні обидва, але не одночасно. */}
        <div className="border-input-border ml-auto inline-flex rounded-full border p-0.5">
          {(
            [
              ['calendar', 'Календар'],
              ['list', 'Список'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-[12.5px] transition-colors',
                view === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-ink-faint hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-[13px]">{getApiErrorMessage(error)}</p>
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          {view === 'calendar' ? (
            <div className="bg-card border-border-muted overflow-hidden rounded-xl border">
              <div className="text-ink-faint grid grid-cols-7 border-b text-center text-[11.5px]">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="py-1.5">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <span
                    key={`blank-${index}`}
                    className="border-border-subtle min-h-16 border-t border-r"
                  />
                ))}
                {days.map((day) => {
                  const key = toDayKey(day);
                  const items = byDay.get(key) ?? [];

                  return (
                    <div
                      key={key}
                      className="border-border-subtle min-h-16 border-t border-r px-1.5 py-1"
                    >
                      <span className="text-ink-faint text-[11.5px]">{day.getDate()}</span>
                      <div className="grid gap-0.5">
                        {items.map((gathering) => (
                          <Link
                            key={gathering.id}
                            to="/gatherings/$gatheringId"
                            params={{ gatheringId: gathering.id }}
                            className="bg-accent text-ink truncate rounded px-1 py-0.5 text-[11px] hover:opacity-80"
                          >
                            {gatheringTitle(gathering)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className={view === 'calendar' ? 'mt-4' : ''}>
            <GatheringList gatherings={gatherings} />
          </div>
        </>
      )}
    </>
  );
}
