import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { formatDate, formatDateTime, formatDayMonth, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  DeletePersonDialog,
  FOLLOW_UP_LABELS,
  getPersonMeta,
  personQueryOptions,
  PersonDialog,
  PersonStatusBadge,
  PERSON_STATUS_HINTS,
  usePerson,
} from '@/modules/people';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/people/$personId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(personQueryOptions(params.personId)),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const { personId } = Route.useParams();
  const navigate = useNavigate();

  // Read through the query, not the loader data, so saving an edit re-renders here.
  const { data: person } = usePerson(personId);
  if (!person) return null;

  const name = getPersonName(person);
  const meta = getPersonMeta(person);

  // "запросити 17.08" — the church writes the action and its date on one line.
  const nextAction = [person.nextAction, person.nextActionAt && formatDayMonth(person.nextActionAt)]
    .filter(Boolean)
    .join(' · ');

  // Місто вже показане окремо в шапці, тут — решта поштової адреси.
  const address = [person.postalCode, person.city, person.district, person.region, person.address]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <PageHeader
        eyebrow="Люди"
        title={name}
        description={meta || undefined}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/people">
                <ArrowLeft />
                До списку
              </Link>
            </Button>

            <PersonDialog person={person}>
              <Button variant="outline">
                <Pencil />
                Редагувати
              </Button>
            </PersonDialog>

            <DeletePersonDialog person={person} onDeleted={() => void navigate({ to: '/people' })}>
              <Button variant="outline" className="text-destructive">
                <Trash2 />
                Видалити
              </Button>
            </DeletePersonDialog>
          </>
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
          <CardContent className="divide-border-subtle grid grid-cols-1 gap-0 divide-y p-5">
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

          <CardContent className="divide-border-subtle grid grid-cols-1 gap-0 divide-y p-5">
            <DetailRow label="Телефон" value={person.phone ?? '—'} />
            {person.homePhone ? <DetailRow label="Домашній" value={person.homePhone} /> : null}
            {person.workPhone ? <DetailRow label="Робочий" value={person.workPhone} /> : null}
            <DetailRow label="Email" value={person.email ?? '—'} />
            <DetailRow label="Адреса" value={address || '—'} multiline />
            <DetailRow
              label="Остання зустріч"
              value={person.lastSeenAt ? formatDate(person.lastSeenAt) : '—'}
            />
            <DetailRow
              label="Дата народження"
              value={person.birthDate ? formatDate(person.birthDate) : '—'}
            />
            {person.baptizedAt ? (
              <DetailRow label="Водне хрещення" value={formatDate(person.baptizedAt)} />
            ) : null}
            {person.memberSince ? (
              <DetailRow label="Член церкви з" value={formatDate(person.memberSince)} />
            ) : null}
            {person.leftAt ? (
              <DetailRow label="Вибув з членства" value={formatDate(person.leftAt)} />
            ) : null}
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

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: ReactNode;
  /** Wraps instead of truncating — for values worth reading in full, like an address. */
  multiline?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[13.5px] first:pt-0 last:pb-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('min-w-0 text-right', multiline ? 'break-words' : 'truncate')}>
        {value}
      </span>
    </div>
  );
}
