import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import {
  DeletePersonDialog,
  getPersonMeta,
  personQueryOptions,
  PersonInlineSections,
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

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            to="/people"
            className="rounded-sm transition-colors hover:text-foreground hover:underline"
            aria-label="Повернутися до списку людей"
          >
            Люди
          </Link>
        }
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

            <DeletePersonDialog person={person} onDeleted={() => void navigate({ to: '/people' })}>
              <Button variant="outline" className="text-destructive">
                <Trash2 />
                Видалити
              </Button>
            </DeletePersonDialog>
          </>
        }
      />

      <PersonInlineSections person={person} />
    </>
  );
}
