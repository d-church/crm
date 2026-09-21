import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Plus, UsersRound } from 'lucide-react';
import { z } from 'zod';

import { PageHeader } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  HOME_GROUP_CATEGORIES,
  HOME_GROUP_CATEGORY_LABELS,
  homeGroupsQueryOptions,
  HomeGroupDialog,
  useHomeGroups,
} from '@/modules/home-groups';
import { getPersonName, type HomeGroupCategory } from '@/services';

const searchSchema = z.object({ category: z.enum(HOME_GROUP_CATEGORIES).optional() });
type HomeGroupsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/_app/home-groups/')({
  validateSearch: (search: Record<string, unknown>): HomeGroupsSearch => {
    const parsed = searchSchema.safeParse(search);

    return parsed.success ? parsed.data : {};
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(homeGroupsQueryOptions({ category: deps.category }));
  },
  component: HomeGroupsPage,
});

function HomeGroupsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: homeGroups = [], isPending, error } = useHomeGroups({ category: search.category });

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Домашні групи"
        actions={
          <HomeGroupDialog>
            <Button>
              <Plus />
              Додати домашню групу
            </Button>
          </HomeGroupDialog>
        }
      />
      <nav className="mb-5 flex flex-wrap gap-2.5" aria-label="Категорії домашніх груп">
        {[undefined, ...HOME_GROUP_CATEGORIES].map((category) => {
          const isActive = search.category === category;

          return (
            <button
              key={category ?? 'all'}
              type="button"
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-light transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input-border bg-card text-ink hover:border-foreground',
              )}
              onClick={() => void navigate({ search: { category }, replace: true })}
            >
              {category === undefined
                ? 'Усі'
                : HOME_GROUP_CATEGORY_LABELS[category as HomeGroupCategory]}
            </button>
          );
        })}
      </nav>
      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <div className="eyebrow text-muted-foreground border-border-muted grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_3.5rem] gap-3 border-b px-4 py-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_6rem] sm:gap-6 sm:px-5">
          <span>Назва</span>
          <span>Лідер</span>
          <span className="text-right">Людей</span>
        </div>
        {error ? (
          <p className="text-destructive p-5 text-sm">{getApiErrorMessage(error)}</p>
        ) : isPending ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        ) : homeGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <UsersRound className="text-muted-foreground size-6" />
            <span className="text-[14px]">
              {search.category
                ? 'У цій категорії ще немає домашніх груп'
                : 'Домашніх груп ще немає'}
            </span>
          </div>
        ) : (
          <div className="divide-border-subtle divide-y">
            {homeGroups.map((homeGroup) => (
              <Link
                key={homeGroup.id}
                to="/home-groups/$homeGroupId"
                params={{ homeGroupId: homeGroup.id }}
                className="hover:bg-accent grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_3.5rem] items-center gap-3 px-4 py-3.5 transition-colors sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_6rem] sm:gap-6 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-secondary text-primary hidden size-8 shrink-0 place-items-center rounded-full sm:grid">
                    <UsersRound className="size-4" />
                  </span>
                  <span className="truncate text-[13.5px]">{homeGroup.name}</span>
                </div>
                <span className="text-ink-soft truncate text-[13px]">
                  {homeGroup.leader ? getPersonName(homeGroup.leader) : 'Не призначено'}
                </span>
                <span className="text-ink-soft text-right text-[13px] tabular-nums">
                  {homeGroup.peopleCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
