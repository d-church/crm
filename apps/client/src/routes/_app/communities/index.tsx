import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { getApiErrorMessage } from '@/lib/api-error';
import { communitiesQueryOptions, CommunityDialog, useCommunities } from '@/modules/communities';
import { getPersonName } from '@/services';

export const Route = createFileRoute('/_app/communities/')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(communitiesQueryOptions());
  },
  component: CommunitiesPage,
});

function CommunitiesPage() {
  const { data: communities, isPending, error } = useCommunities();

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Спільноти"
        actions={
          <CommunityDialog>
            <Button>
              <Plus />
              Додати спільноту
            </Button>
          </CommunityDialog>
        }
      />

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
        ) : communities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersRound className="text-muted-foreground size-6" />
            <span className="text-[14px]">Спільнот ще немає</span>
          </div>
        ) : (
          <div className="divide-border-subtle divide-y">
            {communities.map((community) => (
              <Link
                key={community.id}
                to="/communities/$communityId"
                params={{ communityId: community.id }}
                className="hover:bg-accent grid grid-cols-[1fr_1fr_auto_auto] items-center gap-6 px-5 py-3.5 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-secondary text-primary grid size-8 shrink-0 place-items-center rounded-full">
                    <UsersRound className="size-4" />
                  </span>
                  <span className="truncate text-[13.5px]">{community.name}</span>
                </div>
                <span className="text-ink-soft truncate text-[13px]">
                  {community.leader ? getPersonName(community.leader) : 'Не призначено'}
                </span>
                <span className="text-ink-soft w-24 text-right text-[13px] tabular-nums">
                  {community.peopleCount}
                </span>
                <span className="text-ink-faint w-28 text-right text-[12.5px] tabular-nums">
                  {formatDate(community.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
