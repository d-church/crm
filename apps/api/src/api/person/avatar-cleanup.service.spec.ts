import { ConfigService } from '@nestjs/config';

import type { PrismaService } from '@/infra/prisma/prisma.service';

import { AvatarCleanupService } from './avatar-cleanup.service';
import type { AvatarStorage } from './avatar-storage.service';

describe('AvatarCleanupService', () => {
  const key = 'avatars/dev/person/file.webp';
  const updateMany = jest.fn();
  const deleteMany = jest.fn();
  const findUnique = jest.fn();
  const deleteObject = jest.fn();
  const cleanup = new AvatarCleanupService(
    {
      avatarCleanup: { updateMany, deleteMany },
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
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue(null);
  });

  it('keeps the durable task when R2 fails and completes it on retry', async () => {
    deleteObject
      .mockRejectedValueOnce(new Error('R2 unavailable'))
      .mockResolvedValueOnce(undefined);
    await expect(cleanup.process(key)).rejects.toThrow('R2 unavailable');
    expect(deleteMany).not.toHaveBeenCalled();
    await cleanup.process(key);
    expect(deleteObject).toHaveBeenCalledTimes(2);
    expect(deleteMany).toHaveBeenCalledWith({ where: { key } });
  });

  it('preserves the active object and skips objects from another environment', async () => {
    await cleanup.process('avatars/prod/person/file.webp');
    expect(updateMany).not.toHaveBeenCalled();
    findUnique.mockResolvedValue({ id: 'person' });
    await cleanup.process(key);
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
