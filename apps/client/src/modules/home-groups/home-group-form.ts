import { z } from 'zod';

import { HomeGroupCategory } from '@/services';
import { databaseUuidSchema } from '@/modules/people/uuid';

export const homeGroupSchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
  category: z.enum(HomeGroupCategory),
  address: z.string().trim().max(200, 'Максимум 200 символів'),
  leaderId: z.union([z.literal(''), databaseUuidSchema]),
});

export type HomeGroupValues = z.infer<typeof homeGroupSchema>;
