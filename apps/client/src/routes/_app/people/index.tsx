import { createFileRoute, Link } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout';
import {
  Badge,
  Card,
  CardContent,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import {
  PERSON_STATUS_LABELS,
  PERSON_STATUS_VARIANTS,
  peopleQueryOptions,
  usePeople,
} from '@/modules/people';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/people/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(peopleQueryOptions()),
  component: PeoplePage,
});

function PeoplePage() {
  const { data: people, isPending, error } = usePeople();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = people ?? [];

    if (!needle) return list;

    return list.filter((person) =>
      [getPersonName(person), person.email, person.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }, [people, query]);

  return (
    <>
      <PageHeader
        title="Люди"
        description={
          people?.length
            ? `${people.length} у базі церкви — гості, відвідувачі та члени.`
            : 'Гості, відвідувачі та члени церкви.'
        }
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за іменем, email або телефоном"
              className="pl-9"
              aria-label="Пошук людей"
            />
          </div>
        }
      />

      <Card className="py-0">
        <CardContent className="px-0">
          {error ? (
            <p className="text-destructive p-6 text-sm">{getApiErrorMessage(error)}</p>
          ) : isPending ? (
            <div className="grid gap-2 p-6">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground p-6 text-sm">
              {query ? 'Нічого не знайдено.' : 'У базі ще нікого немає.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Імʼя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Додано</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/people/$personId"
                        params={{ personId: person.id }}
                        className="underline-offset-4 hover:underline"
                      >
                        {getPersonName(person)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{person.email ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{person.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={PERSON_STATUS_VARIANTS[person.status]}>
                        {PERSON_STATUS_LABELS[person.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(person.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
