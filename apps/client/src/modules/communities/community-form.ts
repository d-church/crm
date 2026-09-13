import { z } from 'zod';

export const communitySchema = z.object({
  name: z.string().trim().min(2, 'Мінімум 2 символи').max(80, 'Максимум 80 символів'),
});

export type CommunityValues = z.infer<typeof communitySchema>;
