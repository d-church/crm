export type NavItem = {
  label: string;
  to: string;
  count?: number | string;
};

/** Only sections that actually exist. New ones land here as they are built. */
const BASE_NAV_ITEMS: NavItem[] = [
  { label: 'Огляд', to: '/overview' },
  { label: 'Люди', to: '/people' },
  { label: 'Спільноти', to: '/communities' },
  { label: 'Домашні групи', to: '/home-groups' },
  { label: 'Служіння', to: '/ministries' },
  { label: 'Навчання', to: '/trainings' },
];

const ADMIN_NAV_ITEM: NavItem = { label: 'Адміністрування', to: '/admin' };

/** Церква цілком, без переходу в картки — видно кожному, крім служителів конекту. */
const STRUCTURE_NAV_ITEM: NavItem = { label: 'Структура', to: '/structure' };

/** Борда нових людей. Для служителя конекту вона єдина, для адміна — ще один розділ. */
const CONNECT_NAV_ITEM: NavItem = { label: 'Конект', to: '/connect' };

/**
 * Меню збирається з ролей. Конект бачить лише свою борду, тож структура церкви
 * йому не показується — сервер її однаково не віддасть.
 */
export const getNavItems = (user: { role: UserRole; roles?: UserRole[] }): NavItem[] => {
  const roles = user.roles?.length ? user.roles : [user.role];
  const isConnectOnly = roles.every((role) => role === 'CONNECT');

  // Служитель конекту бачить лише свою борду — ні списку людей, ні структури церкви.
  if (isConnectOnly) return [CONNECT_NAV_ITEM];

  const hasConnect =
    roles.includes('CONNECT') || roles.includes('ADMIN') || roles.includes('SUPERADMIN');
  const items = [
    ...BASE_NAV_ITEMS,
    ...(hasConnect ? [CONNECT_NAV_ITEM] : []),
    STRUCTURE_NAV_ITEM,
    ADMIN_NAV_ITEM,
  ];

  return roles.includes('SUPERADMIN')
    ? [...items, { label: 'Користувачі CRM', to: '/users' }]
    : items;
};
import type { UserRole } from '@/services';
