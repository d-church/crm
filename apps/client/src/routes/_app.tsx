import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/layout';
import { meQueryOptions } from '@/modules/auth';
import { peopleQueryOptions } from '@/modules/people';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQueryOptions());

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }

    // Exposed to every child route through `Route.useRouteContext()`.
    return { user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  // Shares the cache with the people screen — the sidebar count costs no extra request.
  const { data: people } = useQuery(peopleQueryOptions());

  return (
    <AppShell user={user} peopleCount={people?.length}>
      <Outlet />
    </AppShell>
  );
}
