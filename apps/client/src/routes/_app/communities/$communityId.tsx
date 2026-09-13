import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trash2, UsersRound } from 'lucide-react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Card, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  CommunityInlineSection,
  DeleteCommunityDialog,
  communityQueryOptions,
  useCommunity,
} from '@/modules/communities';
import {
  PeoplePagination,
  PeopleTable,
  peopleQueryOptions,
  toPeopleQuery,
  usePeople,
} from '@/modules/people';

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
});

type CommunityDetailSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/_app/communities/$communityId')({
  validateSearch: (search: Record<string, unknown>): CommunityDetailSearch => {
    const parsed = searchSchema.safeParse(search);

    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    const peopleQuery = toPeopleQuery({
      page: deps.page ?? 1,
      communityId: params.communityId,
    });

    void context.queryClient.prefetchQuery(communityQueryOptions(params.communityId));
    void context.queryClient.prefetchQuery(peopleQueryOptions(peopleQuery));
  },
  component: CommunityDetailPage,
});

function CommunityDetailPage() {
  const { communityId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: community,
    isPending: isCommunityPending,
    error: communityError,
  } = useCommunity(communityId);
  const peopleQuery = toPeopleQuery({
    page: search.page ?? 1,
    communityId,
  });
  const {
    data: peoplePage,
    isPending: isPeoplePending,
    error: peopleError,
  } = usePeople(peopleQuery);

  if (communityError) {
    return <p className="text-destructive p-6 text-sm">{getApiErrorMessage(communityError)}</p>;
  }

  if (isCommunityPending || !community) {
    return <Skeleton className="h-48 max-w-xl" />;
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            to="/communities"
            className="rounded-sm transition-colors hover:text-foreground hover:underline"
            aria-label="Повернутися до списку спільнот"
          >
            Спільноти
          </Link>
        }
        title={community.name}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/communities">
                <ArrowLeft />
                До списку
              </Link>
            </Button>
            <DeleteCommunityDialog
              community={community}
              onDeleted={() => void navigate({ to: '/communities' })}
            >
              <Button variant="outline" className="text-destructive">
                <Trash2 />
                Видалити
              </Button>
            </DeleteCommunityDialog>
          </>
        }
      />

      <div className="grid max-w-5xl gap-5">
        <CommunityInlineSection community={community} />

        <Card className="overflow-hidden">
          <div className="bg-secondary border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
            <span className="eyebrow text-muted-foreground">Люди спільноти</span>
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
              <span className="text-[14px]">У цій спільноті ще немає людей</span>
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
