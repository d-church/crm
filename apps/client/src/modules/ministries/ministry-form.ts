import { z } from 'zod';

import { databaseUuidSchema } from '@/modules/people/uuid';

export const ministrySchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
  communityId: z.union([z.literal(''), databaseUuidSchema]),
  leaderId: z.union([z.literal(''), databaseUuidSchema]),
});

export type MinistryValues = z.infer<typeof ministrySchema>;
