import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trash2, UsersRound } from 'lucide-react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Card, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  DeleteHomeGroupDialog,
  homeGroupQueryOptions,
  HomeGroupInlineSection,
  useHomeGroup,
} from '@/modules/home-groups';
import {
  PeoplePagination,
  PeopleTable,
  peopleQueryOptions,
  toPeopleQuery,
  usePeople,
} from '@/modules/people';

const searchSchema = z.object({ page: z.coerce.number().int().min(1).optional() });
type HomeGroupDetailSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/_app/home-groups/$homeGroupId')({
  validateSearch: (search: Record<string, unknown>): HomeGroupDetailSearch => {
    const parsed = searchSchema.safeParse(search);
    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    const peopleQuery = toPeopleQuery({ page: deps.page ?? 1, homeGroupId: params.homeGroupId });
    void context.queryClient.prefetchQuery(homeGroupQueryOptions(params.homeGroupId));
    void context.queryClient.prefetchQuery(peopleQueryOptions(peopleQuery));
  },
  component: HomeGroupDetailPage,
});

function HomeGroupDetailPage() {
  const { homeGroupId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: homeGroup,
    isPending: isHomeGroupPending,
    error: homeGroupError,
  } = useHomeGroup(homeGroupId);
  const peopleQuery = toPeopleQuery({ page: search.page ?? 1, homeGroupId });
  const {
    data: peoplePage,
    isPending: isPeoplePending,
    error: peopleError,
  } = usePeople(peopleQuery);

  if (homeGroupError)
    return <p className="text-destructive p-6 text-sm">{getApiErrorMessage(homeGroupError)}</p>;
  if (isHomeGroupPending || !homeGroup) return <Skeleton className="h-48 max-w-xl" />;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            to="/home-groups"
            className="rounded-sm transition-colors hover:text-foreground hover:underline"
          >
            Домашні групи
          </Link>
        }
        title={homeGroup.name}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/home-groups">
                <ArrowLeft />
                До списку
              </Link>
            </Button>
            <DeleteHomeGroupDialog
              homeGroup={homeGroup}
              onDeleted={() => void navigate({ to: '/home-groups' })}
            >
              <Button variant="outline" className="text-destructive">
                <Trash2 />
                Видалити
              </Button>
            </DeleteHomeGroupDialog>
          </>
        }
      />
      <div className="grid gap-5">
        <HomeGroupInlineSection homeGroup={homeGroup} />
        <Card className="overflow-hidden">
          <div className="bg-secondary border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
            <span className="eyebrow text-muted-foreground">Люди домашньої групи</span>
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
              <span className="text-[14px]">У цій домашній групі ще немає людей</span>
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
