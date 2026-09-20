import { z } from 'zod';

import { databaseUuidSchema } from '@/modules/people/uuid';

export const trainingSchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
  leaderId: z.union([z.literal(''), databaseUuidSchema]),
});

export type TrainingValues = z.infer<typeof trainingSchema>;
