import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';
import { ministriesQueryOptions, MinistryDialog, useMinistries } from '@/modules/ministries';
import { getPersonName, type MinistriesQuery } from '@/services';

const searchSchema = z.object({
  communityId: z.union([z.string().uuid(), z.literal('other')]).optional(),
});
type MinistriesSearch = z.infer<typeof searchSchema>;

const toMinistriesQuery = (communityId?: string): MinistriesQuery =>
  communityId === 'other' ? { withoutCommunity: true } : communityId ? { communityId } : {};

export const Route = createFileRoute('/_app/ministries/')({
  validateSearch: (search: Record<string, unknown>): MinistriesSearch => {
    const parsed = searchSchema.safeParse(search);

    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    void context.queryClient.prefetchQuery(
      ministriesQueryOptions(toMinistriesQuery(deps.communityId)),
    ),
  component: MinistriesPage,
});

function MinistriesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: communities = [],
    isPending: areCommunitiesPending,
    error: communitiesError,
  } = useCommunities();
  const {
    data: ministries = [],
    isPending: areMinistriesPending,
    error: ministriesError,
  } = useMinistries(toMinistriesQuery(search.communityId));

  const defaultCommunityId = communities.some(({ id }) => id === search.communityId)
    ? search.communityId
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Служіння"
        actions={
          <MinistryDialog defaultCommunityId={defaultCommunityId}>
            <Button>
              <Plus />
              Додати служіння
            </Button>
          </MinistryDialog>
        }
      />
      {communitiesError ? (
        <section className="bg-card border-border rounded-xl border p-5">
          <p className="text-destructive text-sm">{getApiErrorMessage(communitiesError)}</p>
        </section>
      ) : null}
      <nav className="mb-5 flex flex-wrap gap-2.5" aria-label="Спільноти служінь">
        <button
          type="button"
          aria-pressed={!search.communityId}
          className={cn(
            'cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-light transition-colors',
            !search.communityId
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input-border bg-card text-ink hover:border-foreground',
          )}
          onClick={() => void navigate({ search: {}, replace: true })}
        >
          Усі
        </button>
        {areCommunitiesPending ? (
          <Skeleton className="h-10 w-28 rounded-full" />
        ) : (
          <>
            {communities.map((community) => {
              const isActive = community.id === search.communityId;

              return (
                <button
                  key={community.id}
                  type="button"
                  aria-pressed={isActive}
                  className={cn(
                    'cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-light transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input-border bg-card text-ink hover:border-foreground',
                  )}
                  onClick={() =>
                    void navigate({ search: { communityId: community.id }, replace: true })
                  }
                >
                  {community.name}
                </button>
              );
            })}
          </>
        )}
        <button
          type="button"
          aria-pressed={search.communityId === 'other'}
          className={cn(
            'cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-light transition-colors',
            search.communityId === 'other'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input-border bg-card text-ink hover:border-foreground',
          )}
          onClick={() => void navigate({ search: { communityId: 'other' }, replace: true })}
        >
          Інші
        </button>
      </nav>
      <section className="bg-card border-border overflow-x-auto rounded-xl border">
        <div className="eyebrow text-muted-foreground border-border-muted grid min-w-[760px] grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_6rem_7rem] gap-5 border-b px-5 py-3">
          <span>Назва</span>
          <span>Спільнота</span>
          <span>Лідер</span>
          <span className="text-right">Людей</span>
          <span className="text-right">Створено</span>
        </div>
        {ministriesError ? (
          <p className="text-destructive p-5 text-sm">{getApiErrorMessage(ministriesError)}</p>
        ) : areMinistriesPending ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : ministries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersRound className="text-muted-foreground size-6" />
            <span className="text-[14px]">
              {search.communityId === 'other'
                ? 'Служінь без спільноти ще немає'
                : search.communityId
                  ? 'У цій спільноті ще немає служінь'
                  : 'Служінь ще немає'}
            </span>
          </div>
        ) : (
          <div className="divide-border-subtle divide-y">
            {ministries.map((ministry) => (
              <Link
                key={ministry.id}
                to="/ministries/$ministryId"
                params={{ ministryId: ministry.id }}
                className="hover:bg-accent grid min-w-[760px] grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_6rem_7rem] items-center gap-5 px-5 py-3.5 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-secondary text-primary grid size-8 shrink-0 place-items-center rounded-full">
                    <UsersRound className="size-4" />
                  </span>
                  <span className="truncate text-[13.5px]">{ministry.name}</span>
                </div>
                <span className="text-ink-soft truncate text-[13px]">
                  {ministry.community?.name ?? 'Для всіх спільнот'}
                </span>
                <span className="text-ink-soft truncate text-[13px]">
                  {ministry.leader ? getPersonName(ministry.leader) : 'Не призначено'}
                </span>
                <span className="text-ink-soft text-right text-[13px] tabular-nums">
                  {ministry.peopleCount}
                </span>
                <span className="text-ink-faint text-right text-[12.5px] tabular-nums">
                  {formatDate(ministry.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
