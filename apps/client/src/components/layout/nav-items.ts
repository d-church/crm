import { Users } from 'lucide-react';
import type { ComponentType } from 'react';

export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [{ to: '/people', label: 'Люди', icon: Users }];
