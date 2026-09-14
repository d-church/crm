import { Link } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';

import logoMark from '@/assets/brand/logo-main.svg';
import { getFullName, getInitials } from '@/lib/format';
import type { User } from '@/services';

import { getNavItems } from './nav-items';
import { NavSection } from './nav-section';
import { UserMenu } from './user-menu';

type SidebarProps = {
  user: User;
  peopleCount?: number;
};

export const Sidebar = ({ user, peopleCount }: SidebarProps) => (
  <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen flex-col gap-8 px-4.5 pt-6.5 pb-5.5 md:flex">
    {/* Negative margin cancels the padding, so the hover area grows without moving the logo. */}
    <Link
      to="/"
      className="hover:bg-sidebar-hover -m-2 flex items-center gap-3 rounded-xl p-2 transition-colors"
    >
      <img src={logoMark} alt="" aria-hidden className="size-9.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px]">D.Church</span>
        <span className="eyebrow text-sidebar-muted">CRM церкви</span>
      </div>
    </Link>

    <NavSection title="Основне" items={getNavItems(user.role)} counts={{ Люди: peopleCount }} />

    <div className="mt-auto flex items-center gap-1.5">
      <Link
        to="/profile"
        className="hover:bg-sidebar-hover -ml-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
        activeProps={{ className: 'bg-sidebar-active text-[#fffdf8]' }}
      >
        <span className="bg-sidebar-avatar grid size-7.5 shrink-0 place-items-center rounded-full text-[11.5px]">
          {getInitials(user)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px]">{getFullName(user)}</span>
          <span className="text-sidebar-muted text-[10.5px]">Адміністратор</span>
        </span>
      </Link>

      <UserMenu user={user}>
        <button
          type="button"
          className="hover:bg-sidebar-hover grid size-8 shrink-0 place-items-center rounded-lg text-sidebar-muted transition-colors hover:text-sidebar-foreground"
          aria-label="Меню користувача"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </UserMenu>
    </div>
  </aside>
);
