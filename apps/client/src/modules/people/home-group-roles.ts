import { HomeGroupRole, type Person } from '@/services';

/**
 * Ким людина є в домашній групі. «Лідер» у переліку не значиться навмисно:
 * лідер один і задається в самій групі, звідси ж виводиться опіка над учасниками.
 * Тому в картці він показується, але не вибирається.
 */
export const HOME_GROUP_ROLE_LABELS: Record<HomeGroupRole, string> = {
  HELPER: 'Помічник',
  REGULAR: 'Регулярний',
  IRREGULAR: 'Нерегулярний',
  GUEST: 'Гість',
};

export const HOME_GROUP_ROLES: HomeGroupRole[] = [
  HomeGroupRole.HELPER,
  HomeGroupRole.REGULAR,
  HomeGroupRole.IRREGULAR,
  HomeGroupRole.GUEST,
];

/** Лідерство читається зі звʼязку групи, а не з поля участі. */
export const isHomeGroupLeader = (person: Person) =>
  person.homeGroup !== null &&
  person.leadingHomeGroups.some(({ id }) => id === person.homeGroup?.id);

export const homeGroupRoleLabel = (person: Person): string | null => {
  if (isHomeGroupLeader(person)) return 'Лідер';

  return person.homeGroupRole ? HOME_GROUP_ROLE_LABELS[person.homeGroupRole] : null;
};
