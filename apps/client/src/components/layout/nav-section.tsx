import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

import type { NavItem } from './nav-items';

type NavSectionProps = {
  title: string;
  items: NavItem[];
  counts?: Record<string, number | string | undefined>;
};

const ITEM_CLASS =
  'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-light transition-colors';

export const NavSection = ({ title, items, counts }: NavSectionProps) => (
  <nav className="flex flex-col gap-0.5">
    <span className="eyebrow text-sidebar-label px-3 pb-2">{title}</span>

    {items.map((item) => {
      const count = counts?.[item.label] ?? item.count;

      return item.to ? (
        <Link
          key={item.label}
          to={item.to}
          className={cn(ITEM_CLASS, 'text-sidebar-item hover:bg-sidebar-hover hover:text-white')}
          activeProps={{ className: 'bg-sidebar-active text-[#fffdf8]' }}
        >
          <span>{item.label}</span>
          <span className="text-sidebar-muted text-[11px] tabular-nums">{count}</span>
        </Link>
      ) : (
        <span
          key={item.label}
          title="Розділ ще не реалізований"
          className={cn(ITEM_CLASS, 'text-sidebar-item/70 cursor-default')}
        >
          <span>{item.label}</span>
          <span className="text-sidebar-muted text-[11px] tabular-nums">{count}</span>
        </span>
      );
    })}
  </nav>
);
