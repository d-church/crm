import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import { getPersonMeta, personQueryOptions, PersonStatusBadge } from '@/modules/people';
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

      <Card className="max-w-2xl overflow-hidden">
        <div className="border-border-muted flex items-center gap-4 border-b p-5">
          <span className="grid size-12 place-items-center rounded-full bg-[#e6ece5] text-sm text-[#3f4a43]">
            {getInitials(name)}
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="text-lg">{name}</span>
            <PersonStatusBadge status={person.status} />
          </div>
        </div>

        <CardContent className="divide-border-subtle grid gap-0 divide-y p-5">
          <DetailRow label="Телефон" value={person.phone ?? '—'} />
          <DetailRow label="Email" value={person.email ?? '—'} />
          <DetailRow label="Місто" value={person.city ?? '—'} />
          <DetailRow label="Мала група" value={person.smallGroup ?? '—'} />
          <DetailRow label="Служіння" value={person.ministry ?? '—'} />
          <DetailRow
            label="Остання зустріч"
            value={person.lastSeenAt ? formatDate(person.lastSeenAt) : '—'}
          />
          <DetailRow
            label="Дата народження"
            value={person.birthDate ? formatDate(person.birthDate) : '—'}
          />
          <DetailRow
            label="З церквою від"
            value={person.joinedAt ? formatDate(person.joinedAt) : '—'}
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
