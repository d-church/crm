import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trash2, UsersRound } from 'lucide-react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Card, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  DeleteMinistryDialog,
  ministryQueryOptions,
  MinistryInlineSection,
  useMinistry,
} from '@/modules/ministries';
import {
  PeoplePagination,
  PeopleTable,
  peopleQueryOptions,
  toPeopleQuery,
  usePeople,
} from '@/modules/people';

const searchSchema = z.object({ page: z.coerce.number().int().min(1).optional() });
type MinistryDetailSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/_app/ministries/$ministryId')({
  validateSearch: (search: Record<string, unknown>): MinistryDetailSearch => {
    const parsed = searchSchema.safeParse(search);
    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    const peopleQuery = toPeopleQuery({ page: deps.page ?? 1, ministryId: params.ministryId });
    void context.queryClient.prefetchQuery(ministryQueryOptions(params.ministryId));
    void context.queryClient.prefetchQuery(peopleQueryOptions(peopleQuery));
  },
  component: MinistryDetailPage,
});

function MinistryDetailPage() {
  const { ministryId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: ministry,
    isPending: isMinistryPending,
    error: ministryError,
  } = useMinistry(ministryId);
  const peopleQuery = toPeopleQuery({ page: search.page ?? 1, ministryId });
  const {
    data: peoplePage,
    isPending: isPeoplePending,
    error: peopleError,
  } = usePeople(peopleQuery);

  if (ministryError)
    return <p className="text-destructive p-6 text-sm">{getApiErrorMessage(ministryError)}</p>;
  if (isMinistryPending || !ministry) return <Skeleton className="h-48 max-w-xl" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            to="/ministries"
            className="rounded-sm transition-colors hover:text-foreground hover:underline"
          >
            Служіння
          </Link>
        }
        title={ministry.name}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ministries" search={{ communityId: ministry.community?.id ?? 'other' }}>
                <ArrowLeft />
                До списку
              </Link>
            </Button>
            <DeleteMinistryDialog
              ministry={ministry}
              onDeleted={() =>
                void navigate({
                  to: '/ministries',
                  search: { communityId: ministry.community?.id ?? 'other' },
                })
              }
            >
              <Button variant="outline" className="text-destructive">
                <Trash2 />
                Видалити
              </Button>
            </DeleteMinistryDialog>
          </>
        }
      />
      <div className="grid gap-5">
        <MinistryInlineSection ministry={ministry} />
        <Card className="overflow-hidden">
          <div className="bg-secondary border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
            <span className="eyebrow text-muted-foreground">Люди служіння</span>
            <span className="text-ink-soft text-xs tabular-nums">
              {peoplePage
                ? `${peoplePage.total} ${peoplePage.total === 1 ? 'людина' : 'людей'}`
                : '…'}
            </span>
          </div>
          {peopleError ? (
            <p className="text-destructive p-6 text-sm">{getApiErrorMessage(peopleError)}</p>
          ) : isPeoplePending ? (
            <div className="grid gap-2 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : peoplePage.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
              <UsersRound className="text-muted-foreground size-6" />
              <span className="text-[14px]">У цьому служінні ще немає людей</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <PeopleTable people={peoplePage.items} />
              </div>
              <PeoplePagination
                page={peoplePage.page}
                pages={peoplePage.pages}
                total={peoplePage.total}
                limit={peoplePage.limit}
                onPageChange={(page) =>
                  void navigate({ search: { page: page === 1 ? undefined : page }, replace: true })
                }
              />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
