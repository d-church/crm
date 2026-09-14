export type NavItem = {
  label: string;
  to: string;
  count?: number | string;
};

/** Only sections that actually exist. New ones land here as they are built. */
const BASE_NAV_ITEMS: NavItem[] = [
  { label: 'Люди', to: '/people' },
  { label: 'Спільноти', to: '/communities' },
  { label: 'Домашні групи', to: '/home-groups' },
];

export const getNavItems = (role: UserRole): NavItem[] =>
  role === 'SUPERADMIN'
    ? [...BASE_NAV_ITEMS, { label: 'Користувачі CRM', to: '/users' }]
    : BASE_NAV_ITEMS;
import type { UserRole } from '@/services';
