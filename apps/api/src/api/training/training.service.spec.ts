import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '@/infra/prisma/prisma.service';

import { TrainingService } from './training.service';

const training = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Основи віри',
  leader: { id: '00000000-0000-4000-8000-000000000011', firstName: 'Ірина', lastName: 'Коваль' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { people: 3 },
};

describe('TrainingService', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  const remove = jest.fn();
  const findMany = jest.fn();
  const service = new TrainingService({
    training: { findMany, findUnique, create, update, delete: remove },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('creates a training without a leader', async () => {
    create.mockResolvedValue({ ...training, leader: null, _count: { people: 0 } });

    await expect(service.create({ name: ' Основи віри ' })).resolves.toMatchObject({
      name: 'Основи віри',
      leader: null,
      peopleCount: 0,
    });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { name: 'Основи віри' } }));
  });

  it('lists trainings alphabetically', async () => {
    findMany.mockResolvedValue([training]);

    await expect(service.findAll()).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { name: 'asc' } }));
  });

  it('allows assigning a leader who has not completed the training', async () => {
    findUnique.mockResolvedValue(training);
    update.mockResolvedValue(training);

    await service.update(training.id, { leaderId: training.leader.id });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { connect: { id: training.leader.id } } } }),
    );
  });

  it('clears a leader without deleting the training', async () => {
    findUnique.mockResolvedValue(training);
    update.mockResolvedValue({ ...training, leader: null });

    await service.update(training.id, { leaderId: null } as never);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { leader: { disconnect: true } } }),
    );
  });

  it('rejects a missing training', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.findOne(training.id)).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing training', async () => {
    findUnique.mockResolvedValue(training);
    remove.mockResolvedValue(training);

    await expect(service.remove(training.id)).resolves.toMatchObject({ id: training.id });
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ where: { id: training.id } }));
  });
});
