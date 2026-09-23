import { ActivityKind } from '@generated/prisma/client';
import type { PrismaService } from '@/infra/prisma/prisma.service';

import { ActivityService } from './activity.service';

const ACTOR = { id: 'u1', name: 'Андрій Татач' };

describe('ActivityService', () => {
  const createMany = jest.fn();
  const findUnique = jest.fn();
  const deleteMany = jest.fn();
  const service = new ActivityService({
    personActivity: { createMany, deleteMany },
    person: { findUnique },
  } as unknown as PrismaService);

  beforeEach(() => jest.resetAllMocks());

  it('writes nothing when nothing changed', async () => {
    await service.log('p1', [], ACTOR);

    expect(createMany).not.toHaveBeenCalled();
  });

  it('stamps every entry with the person and the actor', async () => {
    await service.log('p1', [{ kind: ActivityKind.FIELD_CHANGED, subject: 'city' }], ACTOR);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          personId: 'p1',
          actorId: ACTOR.id,
          actorName: ACTOR.name,
          kind: ActivityKind.FIELD_CHANGED,
          subject: 'city',
        },
      ],
    });
  });

  it('builds the timeline from the oldest entry, mixing life events with card operations', async () => {
    findUnique.mockResolvedValue({
      birthDate: new Date('1981-09-08'),
      firstVisitAt: null,
      baptizedAt: new Date('2005-06-12'),
      memberSince: null,
      leftAt: null,
      lastSeenAt: null,
      events: [
        { occurredAt: new Date('2018-07-21'), kind: 'EVENT', title: 'Одруження', note: null },
        {
          occurredAt: new Date('2026-09-10'),
          kind: 'MEETING',
          title: null,
          note: 'Говорили про домашню групу',
          withPerson: { firstName: 'Петро', lastName: 'Коваль' },
        },
      ],
      steps: [
        {
          completedAt: new Date('2026-09-20'),
          stepType: { name: 'Зустріч для нових' },
        },
      ],
      churchRoles: [
        { since: new Date('2019-03-01'), until: null, roleType: { name: 'Пресвітер' } },
      ],
      ministryAssignments: [],
      activities: [
        {
          id: 'a1',
          createdAt: new Date('2026-09-22T10:00:00.000Z'),
          kind: ActivityKind.FIELD_CHANGED,
          subject: 'membership',
          target: null,
          oldValue: 'GUEST',
          newValue: 'MEMBER',
          actorName: ACTOR.name,
        },
      ],
    });

    const timeline = await service.timeline('p1');

    expect(timeline.map(({ subject, category }) => `${category}:${subject}`)).toEqual([
      'life:Народження',
      'life:Водне хрещення',
      // Подія, внесена руками, стоїть у стрічці нарівні з хрещенням і саном.
      'life:Одруження',
      'life:Прийняв сан',
      // Спілкування читається видом і співрозмовником, а не власною назвою.
      'life:Зустріч — Петро Коваль',
      'life:Пройдено крок',
      'card:membership',
    ]);
    expect(timeline.at(-1)).toMatchObject({ actorName: ACTOR.name, newValue: 'MEMBER' });
    expect(timeline.find(({ subject }) => subject.startsWith('Зустріч'))).toMatchObject({
      target: 'Говорили про домашню групу',
    });
  });

  it('returns an empty timeline for a person that is gone', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.timeline('missing')).resolves.toEqual([]);
  });

  it('removes only the entries that belong to that person', async () => {
    deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.remove('p1', ['a1', 'a2'])).resolves.toEqual({ removed: 2 });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a1', 'a2'] }, personId: 'p1' },
    });
  });

  it('leaves no trace of the cleanup itself', async () => {
    deleteMany.mockResolvedValue({ count: 1 });

    await service.remove('p1', ['a1']);

    expect(createMany).not.toHaveBeenCalled();
  });
});
