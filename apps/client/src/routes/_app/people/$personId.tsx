import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import { PERSON_STATUS_LABELS, PERSON_STATUS_VARIANTS, personQueryOptions } from '@/modules/people';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/people/$personId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(personQueryOptions(params.personId)),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const person = Route.useLoaderData();
  const name = getPersonName(person);

  return (
    <>
      <PageHeader
        title={name}
        description={PERSON_STATUS_LABELS[person.status]}
        actions={
          <Button asChild variant="outline">
            <Link to="/people">
              <ArrowLeft />
              До списку
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="size-12">
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>

          <div className="grid gap-1">
            <CardTitle>{name}</CardTitle>
            <Badge variant={PERSON_STATUS_VARIANTS[person.status]} className="w-fit">
              {PERSON_STATUS_LABELS[person.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-0 divide-y">
          <DetailRow label="Email" value={person.email ?? '—'} />
          <DetailRow label="Телефон" value={person.phone ?? '—'} />
          <DetailRow
            label="Дата народження"
            value={person.birthDate ? formatDate(person.birthDate) : '—'}
          />
          <DetailRow
            label="З церквою від"
            value={person.joinedAt ? formatDate(person.joinedAt) : '—'}
          />
          <DetailRow label="Додано" value={formatDateTime(person.createdAt)} />
          <DetailRow label="Оновлено" value={formatDateTime(person.updatedAt)} />
        </CardContent>

        {person.notes ? (
          <CardContent className="border-t pt-6">
            <p className="text-muted-foreground mb-2 text-sm">Нотатки</p>
            <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
          </CardContent>
        ) : null}
      </Card>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}
