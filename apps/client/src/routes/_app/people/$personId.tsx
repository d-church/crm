import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { formatDate, formatDateTime, formatDayMonth, getInitials } from '@/lib/format';
import {
  FOLLOW_UP_LABELS,
  getPersonMeta,
  personQueryOptions,
  PersonStatusBadge,
  PERSON_STATUS_HINTS,
} from '@/modules/people';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/people/$personId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(personQueryOptions(params.personId)),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const person = Route.useLoaderData();
  const name = getPersonName(person);
  const meta = getPersonMeta(person);

  // "запросити 17.08" — the church writes the action and its date on one line.
  const nextAction = [person.nextAction, person.nextActionAt && formatDayMonth(person.nextActionAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader
        eyebrow="Люди"
        title={name}
        description={meta || undefined}
        actions={
          <Button asChild variant="outline">
            <Link to="/people">
              <ArrowLeft />
              До списку
            </Link>
          </Button>
        }
      />

      <div className="grid max-w-4xl gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card className="overflow-hidden">
          <div className="border-border-muted flex items-center gap-4 border-b p-5">
            <span className="grid size-12 place-items-center rounded-full bg-[#e6ece5] text-sm text-[#3f4a43]">
              {getInitials(name)}
            </span>

            <div className="flex flex-col gap-1.5">
              <span className="text-lg">{name}</span>
              <PersonStatusBadge status={person.status} />
            </div>
          </div>

          {/* Order mirrors the card the pastoral team already keeps by hand. */}
          <CardContent className="divide-border-subtle grid gap-0 divide-y p-5">
            <DetailRow label="Статус" value={PERSON_STATUS_HINTS[person.status]} />
            <DetailRow
              label="Перший візит"
              value={person.firstVisitAt ? formatDayMonth(person.firstVisitAt) : '—'}
            />
            <DetailRow label="Connect" value={person.connectedBy ?? '—'} />
            <DetailRow label="Follow-up" value={FOLLOW_UP_LABELS[person.followUp]} />
            <DetailRow label="Next Step" value={person.nextStep ?? '—'} />
            <DetailRow label="Спільнота" value={person.community ?? 'ще немає'} />
            <DetailRow label="Служіння" value={person.ministry ?? '—'} />
            <DetailRow label="Відповідальний" value={person.responsible ?? '—'} />
            <DetailRow label="Наступна дія" value={nextAction || '—'} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-border-muted border-b px-5 py-3.5">
            <span className="eyebrow text-muted-foreground">Контакти й дати</span>
          </div>

          <CardContent className="divide-border-subtle grid gap-0 divide-y p-5">
            <DetailRow label="Телефон" value={person.phone ?? '—'} />
            <DetailRow label="Email" value={person.email ?? '—'} />
            <DetailRow label="Місто" value={person.city ?? '—'} />
            <DetailRow
              label="Остання зустріч"
              value={person.lastSeenAt ? formatDate(person.lastSeenAt) : '—'}
            />
            <DetailRow
              label="Дата народження"
              value={person.birthDate ? formatDate(person.birthDate) : '—'}
            />
            <DetailRow label="Додано" value={formatDateTime(person.createdAt)} />
          </CardContent>

          {person.notes ? (
            <div className="border-border-muted border-t p-5">
              <p className="eyebrow text-muted-foreground mb-2">Нотатки</p>
              <p className="text-[13.5px] whitespace-pre-wrap">{person.notes}</p>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-[13.5px] first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{value}</span>
    </div>
  );
}
