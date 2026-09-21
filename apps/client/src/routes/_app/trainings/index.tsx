import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { TrainingDialog, trainingsQueryOptions, useTrainings } from '@/modules/trainings';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/trainings/')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(trainingsQueryOptions());
  },
  component: TrainingsPage,
});

function TrainingsPage() {
  const { data: trainings = [], isPending, error } = useTrainings();

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Навчання"
        actions={
          <TrainingDialog>
            <Button>
              <Plus />
              Додати навчання
            </Button>
          </TrainingDialog>
        }
      />
      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <div className="eyebrow text-muted-foreground border-border-muted grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_3.5rem] gap-3 border-b px-4 py-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_6rem] sm:gap-6 sm:px-5">
          <span>Назва</span>
          <span>Лідер</span>
          <span className="text-right">Людей</span>
        </div>
        {error ? (
          <p className="text-destructive p-5 text-sm">{getApiErrorMessage(error)}</p>
        ) : isPending ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersRound className="text-muted-foreground size-6" />
            <span className="text-[14px]">Навчань ще немає</span>
          </div>
        ) : (
          <div className="divide-border-subtle divide-y">
            {trainings.map((training) => (
              <Link
                key={training.id}
                to="/trainings/$trainingId"
                params={{ trainingId: training.id }}
                className="hover:bg-accent grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_3.5rem] items-center gap-3 px-4 py-3.5 transition-colors sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_6rem] sm:gap-6 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-secondary text-primary hidden size-8 shrink-0 place-items-center rounded-full sm:grid">
                    <UsersRound className="size-4" />
                  </span>
                  <span className="truncate text-[13.5px]">{training.name}</span>
                </div>
                <span className="text-ink-soft truncate text-[13px]">
                  {training.leader ? getPersonName(training.leader) : 'Не призначено'}
                </span>
                <span className="text-ink-soft text-right text-[13px] tabular-nums">
                  {training.peopleCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
