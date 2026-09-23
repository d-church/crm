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
  { label: 'Служіння', to: '/ministries' },
  { label: 'Навчання', to: '/trainings' },
];

const ADMIN_NAV_ITEM: NavItem = { label: 'Адміністрування', to: '/admin' };

export const getNavItems = (role: UserRole): NavItem[] =>
  role === 'SUPERADMIN'
    ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM, { label: 'Користувачі CRM', to: '/users' }]
    : [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM];
import type { UserRole } from '@/services';
