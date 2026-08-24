import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { getInitials } from '@/lib/format';
import { useLogout } from '@/modules/auth';
import type { User } from '@/services';

export const UserMenu = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
    void navigate({ to: '/login', replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Меню користувача">
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="grid gap-0.5">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>
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
