import { ConfigService } from '@nestjs/config';

import type { PrismaService } from '@/infra/prisma/prisma.service';

import { AvatarCleanupService } from './avatar-cleanup.service';
import type { AvatarStorage } from './avatar-storage.service';

describe('AvatarCleanupService', () => {
  const key = 'avatars/dev/person/file.webp';
  const findUnique = jest.fn();
  const deleteObject = jest.fn();
  const cleanup = new AvatarCleanupService(
    {
      person: { findUnique },
    } as unknown as PrismaService,
    {
      owns: (value: string) => value.startsWith('avatars/dev/'),
      delete: deleteObject,
    } as unknown as AvatarStorage,
    new ConfigService(),
  );

  beforeEach(() => {
    jest.resetAllMocks();
    findUnique.mockResolvedValue(null);
  });

  it('reports an R2 failure to BullMQ so the job can retry', async () => {
    deleteObject
      .mockRejectedValueOnce(new Error('R2 unavailable'))
      .mockResolvedValueOnce(undefined);
    await expect(cleanup.process(key)).rejects.toThrow('R2 unavailable');
    await cleanup.process(key);
    expect(deleteObject).toHaveBeenCalledTimes(2);
  });

  it('preserves the active object and skips objects from another environment', async () => {
    await cleanup.process('avatars/prod/person/file.webp');
    expect(findUnique).not.toHaveBeenCalled();
    findUnique.mockResolvedValue({ id: 'person' });
    await cleanup.process(key);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
