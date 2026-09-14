import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '@/infra/prisma/prisma.service';
import { HomeGroupCategory } from '@/infra/prisma/prisma.service';

import { HomeGroupService } from './home-group.service';

const homeGroup = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Винники, четвер',
  category: HomeGroupCategory.YOUTH,
  address: 'вул. Шевченка, 12',
  leader: { id: '00000000-0000-4000-8000-000000000011', firstName: 'Ірина', lastName: 'Коваль' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { people: 3 },
};

describe('HomeGroupService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const findMany = jest.fn();
  const service = new HomeGroupService({
    homeGroup: { findMany, findUnique, create, update, delete: remove },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('creates a group without a leader', async () => {
    create.mockResolvedValue({ ...homeGroup, leader: null, _count: { people: 0 } });

    await expect(
      service.create({ name: ' Винники, четвер ', category: HomeGroupCategory.YOUTH }),
    ).resolves.toMatchObject({
      name: 'Винники, четвер',
      category: HomeGroupCategory.YOUTH,
      leader: null,
      peopleCount: 0,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Винники, четвер', category: HomeGroupCategory.YOUTH, address: null },
      }),
    );
  });

  it('filters the list by category', async () => {
    findMany.mockResolvedValue([homeGroup]);

    await expect(service.findAll({ category: HomeGroupCategory.YOUTH })).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category: HomeGroupCategory.YOUTH } }),
    );
  });

  it('allows assigning a leader who is not a member', async () => {
    findUnique.mockResolvedValue(homeGroup);
    update.mockResolvedValue(homeGroup);

    await service.update(homeGroup.id, { leaderId: homeGroup.leader.id });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { connect: { id: homeGroup.leader.id } } } }),
    );
  });

  it('clears a leader without deleting the group', async () => {
    findUnique.mockResolvedValue(homeGroup);
    update.mockResolvedValue({ ...homeGroup, leader: null });

    await service.update(homeGroup.id, { leaderId: null } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { disconnect: true } } }),
    );
  });

  it('normalizes an empty address to null', async () => {
    findUnique.mockResolvedValue(homeGroup);
    update.mockResolvedValue({ ...homeGroup, address: null });

    await service.update(homeGroup.id, { address: '   ' });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { address: null } }));
  });

  it('rejects a missing group', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findOne(homeGroup.id)).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing group', async () => {
    findUnique.mockResolvedValue(homeGroup);
    remove.mockResolvedValue(homeGroup);

    await expect(service.remove(homeGroup.id)).resolves.toMatchObject({ id: homeGroup.id });
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ where: { id: homeGroup.id } }));
  });
});
