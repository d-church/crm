export type NavItem = {
  label: string;
  /** Only built sections have a route; the rest render muted, as in the design. */
  to?: string;
  count?: number | string;
};

export const NAV_PRIMARY: NavItem[] = [
  { label: 'Люди', to: '/people' },
  { label: 'Малі групи' },
  { label: 'Служіння' },
  { label: 'Події' },
  { label: 'Відвідуваність' },
  { label: 'Пожертви' },
];

export const NAV_SECONDARY: NavItem[] = [
  { label: 'Нові гості' },
  { label: 'Молитовні потреби' },
  { label: 'Налаштування' },
];
