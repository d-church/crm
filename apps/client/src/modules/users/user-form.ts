import { z } from 'zod';

import { UserRole } from '@/services';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: 'Суперадмін',
  ADMIN: 'Адміністратор',
};

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
