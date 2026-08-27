import logoMark from '@/assets/brand/logo-main.svg';
import { getInitials } from '@/lib/format';
import type { User } from '@/services';

import { NAV_ITEMS } from './nav-items';
import { NavSection } from './nav-section';
import { UserMenu } from './user-menu';

type SidebarProps = {
  user: User;
  peopleCount?: number;
};

export const Sidebar = ({ user, peopleCount }: SidebarProps) => (
  <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen flex-col gap-8 px-4.5 pt-6.5 pb-5.5 md:flex">
    <div className="flex items-center gap-3">
      <img src={logoMark} alt="" aria-hidden className="size-9.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px]">D.Church</span>
        <span className="eyebrow text-sidebar-muted">CRM церкви</span>
      </div>
    </div>

    <NavSection title="Основне" items={NAV_ITEMS} counts={{ Люди: peopleCount }} />

    <div className="mt-auto">
      <UserMenu user={user}>
        <button
          type="button"
          className="hover:bg-sidebar-hover -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors"
        >
          <span className="bg-sidebar-avatar grid size-7.5 shrink-0 place-items-center rounded-full text-[11.5px]">
            {getInitials(user.name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[12.5px]">{user.name}</span>
            <span className="text-sidebar-muted text-[10.5px]">Адміністратор</span>
          </span>
        </button>
      </UserMenu>
    </div>
  </aside>
);
