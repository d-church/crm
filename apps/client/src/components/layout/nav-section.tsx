import { Link } from '@tanstack/react-router';

import type { NavItem } from './nav-items';

type NavSectionProps = {
  title: string;
  items: NavItem[];
  counts?: Record<string, number | string | undefined>;
};

export const NavSection = ({ title, items, counts }: NavSectionProps) => (
  <nav className="flex flex-col gap-0.5">
    <span className="eyebrow text-sidebar-label px-3 pb-2">{title}</span>

    {items.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        className="text-sidebar-item hover:bg-sidebar-hover flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-light transition-colors hover:text-white"
        activeProps={{ className: 'bg-sidebar-active text-[#fffdf8]' }}
      >
        <span>{item.label}</span>
        <span className="text-sidebar-muted text-[11px] tabular-nums">
          {counts?.[item.label] ?? item.count}
        </span>
      </Link>
    ))}
  </nav>
);
