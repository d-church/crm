import { UserRole } from '@/services';

/** Ролі користувача набором. Стара одинична колонка — лише запасний варіант. */
export const rolesOf = (user: { role: UserRole; roles?: UserRole[] }): UserRole[] =>
  user.roles?.length ? user.roles : [user.role];

export const isSuperadmin = (user: { role: UserRole; roles?: UserRole[] }) =>
  rolesOf(user).includes(UserRole.SUPERADMIN);

export const isAdmin = (user: { role: UserRole; roles?: UserRole[] }) =>
  rolesOf(user).some((role) => role === UserRole.SUPERADMIN || role === UserRole.ADMIN);
