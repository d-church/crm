import type { ReactNode } from 'react';

import type { User } from '@/services';

import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';

type AppShellProps = {
  user: User;
  peopleCount?: number;
  children: ReactNode;
};

export const AppShell = ({ user, peopleCount, children }: AppShellProps) => (
  <div className="bg-background text-foreground grid min-h-screen md:grid-cols-[252px_1fr]">
    <Sidebar user={user} peopleCount={peopleCount} />

    <div className="flex min-w-0 flex-col">
      <MobileNav user={user} />

      <main className="flex min-w-0 flex-1 flex-col gap-6 px-5 pt-6 pb-10 md:px-9 md:pt-8 md:pb-11">
        {children}
      </main>
    </div>
  </div>
);
