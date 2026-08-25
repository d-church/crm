import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useLogout } from '@/modules/auth';
import type { User } from '@/services';

export const UserMenu = ({ user, children }: { user: User; children: ReactNode }) => {
  const navigate = useNavigate();
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
    void navigate({ to: '/login', replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>
          <div className="grid gap-0.5">
            <span className="truncate text-[13px]">{user.name}</span>
            <span className="text-ink-faint truncate text-[11.5px]">{user.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut />
          Вийти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
