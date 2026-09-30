import { z } from 'zod';

import { UserRole } from '@/services';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Суперадмін',
  ADMIN: 'Адміністратор',
  LEADER: 'Лідер',
  CONNECT: 'Конект',
  PASTOR: 'Пастор',
};

/** Що саме роль дозволяє — підказка під галочкою в адмінці. */
export const USER_ROLE_HINTS: Record<UserRole, string> = {
  SUPERADMIN: 'Уся система: користувачі, доступи, довідники, чистка журналу',
  ADMIN: 'Веде реєстр: створює людей, переставляє в структурі, призначає попечителів',
  LEADER: 'Веде свої команди: командний шар учасників',
  CONNECT: 'Заводить нових людей у свою спільноту і веде їх до передачі далі',
  PASTOR: 'Відкриває пасторський шар по всіх, кого видно. Нікого до видимих не додає',
};

export const USER_ROLES: UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.LEADER,
  UserRole.CONNECT,
];

export const createUserSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Мінімум 2 символи').max(20, 'Максимум 20 символів'),
    lastName: z.string().trim().min(2, 'Мінімум 2 символи').max(20, 'Максимум 20 символів'),
    email: z.string().trim().email('Некоректний email'),
    password: z.string().min(8, 'Мінімум 8 символів'),
    confirmPassword: z.string().min(8, 'Мінімум 8 символів'),
    role: z.enum([UserRole.ADMIN, UserRole.SUPERADMIN]),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  });

export type CreateUserValues = z.infer<typeof createUserSchema>;
