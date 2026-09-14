import { z } from 'zod';

import { databaseUuidSchema } from '@/modules/people/uuid';

export const communitySchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
  leaderId: z.union([z.literal(''), databaseUuidSchema]),
});

export type CommunityValues = z.infer<typeof communitySchema>;
