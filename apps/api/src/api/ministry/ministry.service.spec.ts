import { NotFoundException } from '@nestjs/common';

import { MinistryRole, type PrismaService } from '@/infra/prisma/prisma.service';

import { MinistryService } from './ministry.service';

const leader = {
  id: '00000000-0000-4000-8000-000000000011',
  firstName: 'Ірина',
  lastName: 'Коваль',
};

const ministry = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Прославлення',
  community: { id: '00000000-0000-4000-8000-000000000001', name: 'D.Youth' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  assignments: [{ id: 'a1', role: MinistryRole.LEADER, person: leader }],
};

describe('MinistryService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const findMany = jest.fn();
  const assignmentFindFirst = jest.fn();
  const assignmentCreate = jest.fn();
  const assignmentUpdate = jest.fn();
  const assignmentUpdateMany = jest.fn();
  const service = new MinistryService({
    ministry: { findMany, findUnique, create, update, delete: remove },
    ministryAssignment: {
      findFirst: assignmentFindFirst,
      create: assignmentCreate,
      update: assignmentUpdate,
      updateMany: assignmentUpdateMany,
    },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('creates a ministry in its community without a leader', async () => {
    create.mockResolvedValue({ ...ministry, assignments: [] });

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

  it('creates a ministry without a community', async () => {
    create.mockResolvedValue({ ...ministry, name: 'Welcome', community: null, assignments: [] });

    await expect(service.create({ name: ' Welcome ' })).resolves.toMatchObject({
      name: 'Welcome',
      community: null,
    });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Welcome' } }));
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

  it('lists all ministries or only those without a community', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));

    await service.findAll({ withoutCommunity: 'true' });
    expect(findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { communityId: null } }),
    );
  });

  it('makes a leader out of someone who has no assignment yet', async () => {
    findUnique.mockResolvedValue(ministry);
    assignmentFindFirst.mockResolvedValue(null);

    await service.update(ministry.id, { leaderId: leader.id });

    expect(assignmentCreate).toHaveBeenCalledWith({
      data: { ministryId: ministry.id, personId: leader.id, role: MinistryRole.LEADER },
    });
  });

  it('promotes an existing member instead of adding a second assignment', async () => {
    findUnique.mockResolvedValue(ministry);
    assignmentFindFirst.mockResolvedValue({ id: 'a2' });

    await service.update(ministry.id, { leaderId: leader.id });

    expect(assignmentUpdate).toHaveBeenCalledWith({
      where: { id: 'a2' },
      data: { role: MinistryRole.LEADER },
    });
    expect(assignmentCreate).not.toHaveBeenCalled();
  });

  it('leaves a replaced leader in the team as a member', async () => {
    findUnique.mockResolvedValue(ministry);
    assignmentFindFirst.mockResolvedValue(null);

    await service.update(ministry.id, { leaderId: null });

    expect(assignmentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: MinistryRole.MEMBER } }),
    );
    expect(assignmentCreate).not.toHaveBeenCalled();
  });

  it('removes a ministry from its community without deleting it', async () => {
    findUnique.mockResolvedValueOnce(ministry).mockResolvedValueOnce({
      ...ministry,
      community: null,
    });
    update.mockResolvedValue({ ...ministry, community: null });

    await expect(service.update(ministry.id, { communityId: null })).resolves.toMatchObject({
      community: null,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { community: { disconnect: true } } }),
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
