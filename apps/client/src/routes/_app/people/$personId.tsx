import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import {
  PersonDetails,
  PersonHero,
  PersonTimeline,
  personQueryOptions,
  personTimelineQueryOptions,
  usePerson,
} from '@/modules/people';

const searchSchema = z.object({ view: z.enum(['card', 'timeline']).optional() });

export const Route = createFileRoute('/_app/people/$personId')({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = searchSchema.safeParse(search);

    return parsed.success ? parsed.data : {};
  },
  loader: ({ context, params }) => {
    // Хронологію підвантажуємо заздалегідь: перемикач має спрацьовувати миттєво.
    void context.queryClient.prefetchQuery(personTimelineQueryOptions(params.personId));

    return context.queryClient.ensureQueryData(personQueryOptions(params.personId));
  },
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const { personId } = Route.useParams();
  const { view = 'card' } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  // Read through the query, not the loader data, so saving an edit re-renders here.
  const { data: person } = usePerson(personId);
  if (!person) return null;

  return (
    <div className="grid gap-4">
      <PersonHero
        person={person}
        view={view}
        // Вигляд живе в URL, тож посилання на хронологію можна скинути колезі.
        onViewChange={(next) =>
          void navigate({ search: next === 'card' ? {} : { view: next }, replace: true })
        }
        onDeleted={() => void navigate({ to: '/people' })}
      />

      {view === 'timeline' ? (
        <PersonTimeline personId={person.id} />
      ) : (
        <PersonDetails person={person} />
      )}
    </div>
  );
}
