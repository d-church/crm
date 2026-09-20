import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCommunities } from '@/modules/communities';
import { ministriesQueryOptions, MinistryDialog, useMinistries } from '@/modules/ministries';
import { getPersonName } from '@/services';

const searchSchema = z.object({ communityId: z.string().uuid().optional() });
type MinistriesSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/_app/ministries/')({
  validateSearch: (search: Record<string, unknown>): MinistriesSearch => {
    const parsed = searchSchema.safeParse(search);

    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    if (deps.communityId) {
      void context.queryClient.prefetchQuery(
        ministriesQueryOptions({ communityId: deps.communityId }),
      );
    }
  },
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
  const selectedCommunityId =
    communities.find(({ id }) => id === search.communityId)?.id ?? communities[0]?.id;
  const {
    data: ministries = [],
    isPending: areMinistriesPending,
    error: ministriesError,
  } = useMinistries(
    selectedCommunityId ? { communityId: selectedCommunityId } : {},
    selectedCommunityId !== undefined,
  );

  useEffect(() => {
    if (selectedCommunityId && selectedCommunityId !== search.communityId) {
      void navigate({ search: { communityId: selectedCommunityId }, replace: true });
    }
  }, [navigate, search.communityId, selectedCommunityId]);

  const error = communitiesError ?? ministriesError;
  const isPending =
    areCommunitiesPending || (selectedCommunityId !== undefined && areMinistriesPending);

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Служіння"
        actions={
          <MinistryDialog defaultCommunityId={selectedCommunityId}>
            <Button disabled={communities.length === 0}>
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
      ) : areCommunitiesPending ? (
        <div className="mb-5 flex gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <section className="bg-card border-border rounded-xl border px-5 py-14 text-center">
          <p className="text-[14px]">Спочатку додайте спільноту, щоб створити служіння.</p>
        </section>
      ) : (
        <>
          <nav className="mb-5 flex flex-wrap gap-2.5" aria-label="Спільноти служінь">
            {communities.map((community) => {
              const isActive = community.id === selectedCommunityId;

              return (
                <button
                  key={community.id}
                  type="button"
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
          </nav>
          <section className="bg-card border-border overflow-hidden rounded-xl border">
            <div className="eyebrow text-muted-foreground border-border-muted grid grid-cols-[1fr_1fr_auto_auto] gap-6 border-b px-5 py-3">
              <span>Назва</span>
              <span>Лідер</span>
              <span className="w-24 text-right">Людей</span>
              <span className="w-28 text-right">Створено</span>
            </div>
            {error ? (
              <p className="text-destructive p-5 text-sm">{getApiErrorMessage(error)}</p>
            ) : isPending ? (
              <div className="grid gap-2 p-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-11" />
                ))}
              </div>
            ) : ministries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
                <UsersRound className="text-muted-foreground size-6" />
                <span className="text-[14px]">У цій спільноті ще немає служінь</span>
              </div>
            ) : (
              <div className="divide-border-subtle divide-y">
                {ministries.map((ministry) => (
                  <Link
                    key={ministry.id}
                    to="/ministries/$ministryId"
                    params={{ ministryId: ministry.id }}
                    className="hover:bg-accent grid grid-cols-[1fr_1fr_auto_auto] items-center gap-6 px-5 py-3.5 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="bg-secondary text-primary grid size-8 shrink-0 place-items-center rounded-full">
                        <UsersRound className="size-4" />
                      </span>
                      <span className="truncate text-[13.5px]">{ministry.name}</span>
                    </div>
                    <span className="text-ink-soft truncate text-[13px]">
                      {ministry.leader ? getPersonName(ministry.leader) : 'Не призначено'}
                    </span>
                    <span className="text-ink-soft w-24 text-right text-[13px] tabular-nums">
                      {ministry.peopleCount}
                    </span>
                    <span className="text-ink-faint w-28 text-right text-[12.5px] tabular-nums">
                      {formatDate(ministry.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
