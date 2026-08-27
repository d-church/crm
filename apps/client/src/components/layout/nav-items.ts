export type NavItem = {
  label: string;
  to: string;
  count?: number | string;
};

/** Only sections that actually exist. New ones land here as they are built. */
export const NAV_ITEMS: NavItem[] = [{ label: 'Люди', to: '/people' }];
