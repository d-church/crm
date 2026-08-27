import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { AppShell } from '@/components/layout';
import { meQueryOptions } from '@/modules/auth';
import { peopleStatsQueryOptions } from '@/modules/people';

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
  // Shares the stats cache with the people screen — no extra request for the count.
  const { data: stats } = useQuery(peopleStatsQueryOptions());

  return (
    <AppShell user={user} peopleCount={stats?.total}>
      <Outlet />
    </AppShell>
  );
}
