import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '@/infra/prisma/prisma.service';

import { MinistryService } from './ministry.service';

const ministry = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Прославлення',
  community: { id: '00000000-0000-4000-8000-000000000001', name: 'D.Youth' },
  leader: { id: '00000000-0000-4000-8000-000000000011', firstName: 'Ірина', lastName: 'Коваль' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { people: 3 },
};

describe('MinistryService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const findMany = jest.fn();
  const service = new MinistryService({
    ministry: { findMany, findUnique, create, update, delete: remove },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('creates a ministry in its community without a leader', async () => {
    create.mockResolvedValue({ ...ministry, leader: null, _count: { people: 0 } });

    await expect(
      service.create({ name: ' Прославлення ', communityId: ministry.community.id }),
    ).resolves.toMatchObject({
      name: 'Прославлення',
      community: ministry.community,
      leader: null,
      peopleCount: 0,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Прославлення', community: { connect: { id: ministry.community.id } } },
      }),
    );
  });

  it('filters the list by community', async () => {
    findMany.mockResolvedValue([ministry]);

    await expect(service.findAll({ communityId: ministry.community.id })).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { communityId: ministry.community.id },
        orderBy: [
          { community: { sortOrder: 'asc' } },
          { community: { name: 'asc' } },
          { name: 'asc' },
        ],
      }),
    );
  });

  it('allows a leader who is not a member', async () => {
    findUnique.mockResolvedValue(ministry);
    update.mockResolvedValue(ministry);

    await service.update(ministry.id, { leaderId: ministry.leader.id });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { connect: { id: ministry.leader.id } } } }),
    );
  });

  it('moves a ministry to another community and clears a leader', async () => {
    findUnique.mockResolvedValue(ministry);
    update.mockResolvedValue({ ...ministry, leader: null });
    const communityId = '00000000-0000-4000-8000-000000000012';

    await service.update(ministry.id, { communityId, leaderId: null } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          community: { connect: { id: communityId } },
          leader: { disconnect: true },
        },
      }),
    );
  });

  it('rejects a missing ministry', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findOne(ministry.id)).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing ministry', async () => {
    findUnique.mockResolvedValue(ministry);
    remove.mockResolvedValue(ministry);

    await expect(service.remove(ministry.id)).resolves.toMatchObject({ id: ministry.id });
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ where: { id: ministry.id } }));
  });
});
