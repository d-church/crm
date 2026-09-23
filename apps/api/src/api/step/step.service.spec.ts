import { ConflictException } from '@nestjs/common';

import type { ActivityService } from '@/api/activity/activity.service';
import { StepState, type PrismaService } from '@/infra/prisma/prisma.service';

import { StepService, toStepData } from './step.service';

describe('toStepData', () => {
  it('leaves untouched fields out so a PATCH stays partial', () => {
    expect(toStepData({ responsible: 'Петро' })).toEqual({ responsible: 'Петро' });
  });

  it('stamps today when a step is marked done without a date', () => {
    const data = toStepData({ state: StepState.DONE });

    expect(data.state).toBe(StepState.DONE);
    expect(data.completedAt).toBeInstanceOf(Date);
  });

  it('keeps an explicit completion date', () => {
    expect(toStepData({ state: StepState.DONE, completedAt: '2026-09-01' })).toEqual({
      state: StepState.DONE,
      completedAt: new Date('2026-09-01'),
    });
  });

  it('clears the completion date when a step goes back into work', () => {
    expect(toStepData({ state: StepState.IN_PROGRESS })).toEqual({
      state: StepState.IN_PROGRESS,
      completedAt: null,
    });
  });

  it('turns dates into Date instances and passes null through', () => {
    expect(toStepData({ dueAt: '2026-10-01' })).toEqual({ dueAt: new Date('2026-10-01') });
    expect(toStepData({ dueAt: null })).toEqual({ dueAt: null });
  });
});

/** Журнал тут не перевіряється, тож досить заглушки. */
const activityStub = { log: jest.fn(), logMany: jest.fn() } as unknown as ActivityService;

describe('StepService catalog', () => {
  const findUnique = jest.fn();
  const remove = jest.fn();
  const service = new StepService(
    {
      stepType: { findUnique, delete: remove },
    } as unknown as PrismaService,
    activityStub,
  );

  beforeEach(() => jest.resetAllMocks());

  it('refuses to delete a step someone is walking through', async () => {
    findUnique.mockResolvedValue({
      id: 'step-1',
      name: 'Водне хрещення',
      _count: { steps: 2 },
    });

    await expect(service.removeType('step-1')).rejects.toThrow(ConflictException);
    expect(remove).not.toHaveBeenCalled();
  });

  it('deletes a step nobody has been given', async () => {
    findUnique.mockResolvedValue({ id: 'step-1', name: 'Зайвий крок', _count: { steps: 0 } });
    remove.mockResolvedValue({ id: 'step-1', name: 'Зайвий крок', _count: { steps: 0 } });

    await expect(service.removeType('step-1')).resolves.toMatchObject({ usageCount: 0 });
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'step-1' } }));
  });
});
