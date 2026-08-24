import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { Button, Toaster } from '@/components/ui';

const Devtools = import.meta.env.DEV ? lazy(() => import('@/components/devtools')) : () => null;

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />

      <Suspense fallback={null}>
        <Devtools />
      </Suspense>
    </>
  );
}

function NotFoundComponent() {
  return (
    <CenteredMessage title="404" description="Такої сторінки не існує.">
      <Button asChild>
        <Link to="/">На головну</Link>
      </Button>
    </CenteredMessage>
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <CenteredMessage title="Помилка" description={error.message}>
      <Button onClick={reset}>Спробувати ще раз</Button>
    </CenteredMessage>
  );
}

function CenteredMessage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-muted-foreground max-w-md text-sm">{description}</p> : null}
      {children}
    </div>
  );
}
