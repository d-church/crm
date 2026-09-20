import { z } from 'zod';

import { databaseUuidSchema } from '@/modules/people/uuid';

export const ministrySchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
  communityId: z.string().min(1, 'Оберіть спільноту').pipe(databaseUuidSchema),
  leaderId: z.union([z.literal(''), databaseUuidSchema]),
});

export type MinistryValues = z.infer<typeof ministrySchema>;
