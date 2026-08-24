import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

import { NAV_ITEMS } from './nav-items';

export const Sidebar = () => (
  <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col border-r md:flex">
    <div className="flex h-14 items-center gap-2 px-5">
      <span className="bg-primary size-6 rounded-md" />
      <span className="font-semibold tracking-tight">D.Church CRM</span>
    </div>

    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            'text-sidebar-foreground/70 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
          activeProps={{
            className: 'bg-sidebar-accent text-sidebar-accent-foreground',
          }}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  </aside>
);
