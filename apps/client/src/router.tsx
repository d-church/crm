import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { ApiService } from '@/services';
import { ME_QUERY_KEY } from '@/modules/auth';

import { routeTree } from './routeTree.gen';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // React Query owns caching, so loaders should always re-run on visit.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

/** A refresh that could not be recovered means the session is gone. */
ApiService.setUnauthorizedHandler(() => {
  queryClient.setQueryData(ME_QUERY_KEY, null);

  void router.navigate({
    to: '/login',
    search: { redirect: router.state.location.href },
    replace: true,
  });
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
