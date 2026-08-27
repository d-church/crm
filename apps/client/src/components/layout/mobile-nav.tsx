import { Link } from '@tanstack/react-router';

import logoMark from '@/assets/brand/logo-main.svg';
import { getInitials } from '@/lib/format';
import type { User } from '@/services';

import { NAV_ITEMS } from './nav-items';
import { UserMenu } from './user-menu';

/** Below `md` the sidebar collapses into a header plus a scrollable nav strip. */
export const MobileNav = ({ user }: { user: User }) => (
  <div className="bg-sidebar text-sidebar-foreground sticky top-0 z-20 md:hidden">
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <img src={logoMark} alt="" aria-hidden className="size-7 shrink-0" />
        <span className="text-[13px]">D.Church</span>
      </div>

      <UserMenu user={user}>
        <button
          type="button"
          className="bg-sidebar-avatar grid size-8 place-items-center rounded-full text-[11.5px]"
          aria-label="Меню користувача"
        >
          {getInitials(user.name)}
        </button>
      </UserMenu>
    </div>

    <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-sidebar-item shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-light"
          activeProps={{ className: 'bg-sidebar-active text-[#fffdf8]' }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  </div>
);
