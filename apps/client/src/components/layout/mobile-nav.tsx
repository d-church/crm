import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

import { NAV_ITEMS } from './nav-items';

/** The sidebar is hidden below `md`, so navigation moves under the header. */
export const MobileNav = () => (
  <nav className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
      <Link
        key={to}
        to={to}
        className={cn(
          'text-muted-foreground flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
        )}
        activeProps={{ className: 'bg-accent text-accent-foreground' }}
      >
        <Icon className="size-4" />
        {label}
      </Link>
    ))}
  </nav>
);
