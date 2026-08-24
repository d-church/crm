import type { ReactNode } from 'react';

import type { User } from '@/services';

import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { UserMenu } from './user-menu';

type AppShellProps = {
  user: User;
  children: ReactNode;
};

export const AppShell = ({ user, children }: AppShellProps) => (
  <div className="flex min-h-svh">
    <Sidebar />

    <div className="flex min-w-0 flex-1 flex-col">
      <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b px-5 backdrop-blur">
        <span className="font-semibold tracking-tight md:hidden">D.Church CRM</span>
        <div className="flex-1" />
        <UserMenu user={user} />
      </header>

      <MobileNav />

      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  </div>
);
