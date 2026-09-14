import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '@/infra/prisma/prisma.service';

import { CommunityService } from './community.service';

const community = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'D.Youth',
  leader: { id: '00000000-0000-4000-8000-000000000002', firstName: 'Ірина', lastName: 'Коваль' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { people: 2 },
};

describe('CommunityService', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const findMany = jest.fn();
  const create = jest.fn();
  const remove = jest.fn();
  const service = new CommunityService({
    community: { findUnique, update, findMany, create, delete: remove },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('returns a community with its member count', async () => {
    findUnique.mockResolvedValue(community);

    await expect(service.findOne(community.id)).resolves.toEqual({
      ...community,
      peopleCount: 2,
      _count: undefined,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: community.id },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { people: true } },
      },
    });
  });

  it('rejects a missing community', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findOne(community.id)).rejects.toThrow(NotFoundException);
  });

  it('trims and updates a community name', async () => {
    findUnique.mockResolvedValue(community);
    update.mockResolvedValue({ ...community, name: 'D.Family' });

    await expect(service.update(community.id, { name: ' D.Family ' })).resolves.toMatchObject({
      name: 'D.Family',
      peopleCount: 2,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: community.id },
      data: { name: 'D.Family' },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { people: true } },
      },
    });
  });

  it('allows assigning a leader who is not a member', async () => {
    findUnique.mockResolvedValue(community);
    update.mockResolvedValue(community);

    await service.update(community.id, { leaderId: community.leader.id });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { connect: { id: community.leader.id } } } }),
    );
  });

  it('clears a leader without deleting the community', async () => {
    findUnique.mockResolvedValue(community);
    update.mockResolvedValue({ ...community, leader: null });

    await service.update(community.id, { leaderId: null } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { disconnect: true } } }),
    );
  });

  it('passes a duplicate-name constraint failure through to the API filter', async () => {
    findUnique.mockResolvedValue(community);
    const duplicateNameError = new Error('Unique constraint failed on the fields: (`name`)');
    update.mockRejectedValue(duplicateNameError);

    await expect(service.update(community.id, { name: 'D.Young' })).rejects.toBe(
      duplicateNameError,
    );
  });

  it('deletes an existing community', async () => {
    findUnique.mockResolvedValue(community);
    remove.mockResolvedValue(community);

    await expect(service.remove(community.id)).resolves.toMatchObject({
      id: community.id,
      peopleCount: 2,
    });
    expect(remove).toHaveBeenCalledWith({
      where: { id: community.id },
      include: {
        leader: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { people: true } },
      },
    });
  });
});
