import { ConflictException } from '@nestjs/common';

import type { ActivityService } from '@/api/activity/activity.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';

import { ChurchRoleService, toRoleData } from './church-role.service';

describe('toRoleData', () => {
  it('leaves untouched dates out so a PATCH stays partial', () => {
    expect(toRoleData({})).toEqual({});
  });

  it('turns dates into Date instances and passes null through', () => {
    expect(toRoleData({ since: '2020-05-10' })).toEqual({ since: new Date('2020-05-10') });
    expect(toRoleData({ until: null })).toEqual({ until: null });
  });
});

/** Журнал тут не перевіряється, тож досить заглушки. */
const activityStub = { log: jest.fn(), logMany: jest.fn() } as unknown as ActivityService;

describe('ChurchRoleService catalog', () => {
  const findUnique = jest.fn();
  const remove = jest.fn();
  const service = new ChurchRoleService(
    {
      churchRoleType: { findUnique, delete: remove },
    } as unknown as PrismaService,
    activityStub,
  );

  beforeEach(() => jest.resetAllMocks());

  it('refuses to delete a rank someone holds', async () => {
    findUnique.mockResolvedValue({ id: 'r1', name: 'Пресвітер', _count: { roles: 3 } });

    await expect(service.removeType('r1')).rejects.toThrow(ConflictException);
    expect(remove).not.toHaveBeenCalled();
  });

  it('deletes a rank nobody was ever given', async () => {
    findUnique.mockResolvedValue({ id: 'r1', name: 'Зайвий сан', _count: { roles: 0 } });
    remove.mockResolvedValue({ id: 'r1', name: 'Зайвий сан', _count: { roles: 0 } });

    await expect(service.removeType('r1')).resolves.toMatchObject({ usageCount: 0 });
  });
});
