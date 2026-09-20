import { PersonService } from './person.service';

import { PersonStatus, type PrismaService } from '@/infra/prisma/prisma.service';

import { buildPeopleOrderBy, buildPeopleWhere, toPersonData } from './person.service';

describe('toPersonData', () => {
  it('leaves untouched fields out so a PATCH stays partial', () => {
    expect(toPersonData({ firstName: 'Ігор' })).toEqual({ firstName: 'Ігор' });
  });

  it('turns ISO date strings into Date instances', () => {
    expect(toPersonData({ birthDate: '1990-12-10' })).toEqual({
      birthDate: new Date('1990-12-10'),
    });
  });

  it('passes null through so a cleared date clears the column', () => {
    expect(toPersonData({ birthDate: null })).toEqual({ birthDate: null });
  });

  it('never turns null into the Unix epoch', () => {
    expect(toPersonData({ lastSeenAt: null, memberSince: null })).toEqual({
      lastSeenAt: null,
      memberSince: null,
    });
  });

  it('handles every date field', () => {
    const data = toPersonData({
      birthDate: '1990-12-10',
      firstVisitAt: '2026-08-09',
      lastSeenAt: '2026-08-17',
      nextActionAt: '2026-08-20',
      baptizedAt: '1998-07-27',
      memberSince: '2005-01-24',
      leftAt: '2024-03-01',
    });

    for (const value of Object.values(data)) {
      expect(value).toBeInstanceOf(Date);
    }
  });

  it('leaves non-date fields alone', () => {
    expect(toPersonData({ notes: null, city: 'Львів' })).toEqual({ notes: null, city: 'Львів' });
  });

  it('replaces the complete community set', () => {
    expect(
      toPersonData({
        communityIds: [
          '00000000-0000-4000-8000-000000000001',
          '00000000-0000-4000-8000-000000000002',
        ],
      }),
    ).toEqual({
      communities: {
        set: [
          { id: '00000000-0000-4000-8000-000000000001' },
          { id: '00000000-0000-4000-8000-000000000002' },
        ],
      },
    });
  });

  it('clears all communities when an empty set is sent', () => {
    expect(toPersonData({ communityIds: [] })).toEqual({ communities: { set: [] } });
  });

  it('replaces and clears the complete ministry set', () => {
    expect(
      toPersonData({
        ministryIds: ['00000000-0000-4000-8000-000000000003'],
      }),
    ).toEqual({ ministries: { set: [{ id: '00000000-0000-4000-8000-000000000003' }] } });
    expect(toPersonData({ ministryIds: [] })).toEqual({ ministries: { set: [] } });
  });

  it('replaces and clears the complete training set', () => {
    expect(
      toPersonData({
        trainingIds: ['00000000-0000-4000-8000-000000000004'],
      }),
    ).toEqual({ trainings: { set: [{ id: '00000000-0000-4000-8000-000000000004' }] } });
    expect(toPersonData({ trainingIds: [] })).toEqual({ trainings: { set: [] } });
  });

  it('sets and clears the optional home group', () => {
    const homeGroupId = '00000000-0000-4000-8000-000000000010';

    expect(toPersonData({ homeGroupId })).toEqual({ homeGroupId });
    expect(toPersonData({ homeGroupId: null })).toEqual({ homeGroupId: null });
  });
});

describe('buildPeopleWhere', () => {
  it('is empty when nothing is filtered', () => {
    expect(buildPeopleWhere({})).toEqual({});
  });

  it('matches a status, community membership and ministry membership exactly', () => {
    expect(
      buildPeopleWhere({
        status: PersonStatus.SERVING,
        communityId: '00000000-0000-4000-8000-000000000001',
        ministryId: '00000000-0000-4000-8000-000000000003',
        trainingId: '00000000-0000-4000-8000-000000000004',
      }),
    ).toEqual({
      status: PersonStatus.SERVING,
      communities: { some: { id: '00000000-0000-4000-8000-000000000001' } },
      ministries: { some: { id: '00000000-0000-4000-8000-000000000003' } },
      trainings: { some: { id: '00000000-0000-4000-8000-000000000004' } },
    });
  });

  it('matches a home group exactly', () => {
    expect(buildPeopleWhere({ homeGroupId: '00000000-0000-4000-8000-000000000010' })).toEqual({
      homeGroupId: '00000000-0000-4000-8000-000000000010',
    });
  });

  it('filters by completed age and excludes people without a birth date', () => {
    const now = new Date('2026-09-14T12:00:00.000Z');
    const where = buildPeopleWhere({ minAge: 18, maxAge: 30 }, now);
    const birthDate = where.birthDate as { not: null; lte: Date; gt: Date };

    expect(birthDate.not).toBeNull();
    expect(birthDate.lte).toEqual(new Date('2008-09-14T12:00:00.000Z'));
    expect(birthDate.gt).toEqual(new Date('1995-09-14T12:00:00.000Z'));
  });

  it('searches every field case-insensitively', () => {
    const where = buildPeopleWhere({ search: 'петр' });

    expect(where.AND).toHaveLength(1);
    expect(where.AND).toEqual([
      {
        OR: [
          { firstName: { contains: 'петр', mode: 'insensitive' } },
          { lastName: { contains: 'петр', mode: 'insensitive' } },
          { phone: { contains: 'петр', mode: 'insensitive' } },
          { homePhone: { contains: 'петр', mode: 'insensitive' } },
          { workPhone: { contains: 'петр', mode: 'insensitive' } },
          { email: { contains: 'петр', mode: 'insensitive' } },
          { city: { contains: 'петр', mode: 'insensitive' } },
        ],
      },
    ]);
  });

  it('requires every term to match, so a full name works', () => {
    const where = buildPeopleWhere({ search: 'Іван Петренко' });

    // One AND clause per term — no single column holds the full name.
    expect(where.AND).toHaveLength(2);
  });

  it('collapses padding and repeated spaces', () => {
    expect(buildPeopleWhere({ search: '   Іван    Петренко  ' }).AND).toHaveLength(2);
  });

  it('ignores a blank search', () => {
    expect(buildPeopleWhere({ search: '   ' })).toEqual({});
  });

  it('adds the condition filter next to the search terms without clobbering simple filters', () => {
    const now = new Date('2026-09-14T12:00:00.000Z');
    const where = buildPeopleWhere(
      {
        search: 'Іван',
        minAge: 18,
        filter: { match: 'any', conditions: [{ field: 'age', operator: 'isEmpty' }] },
      },
      now,
    );

    expect(where.birthDate).toMatchObject({ not: null });
    expect(where.AND).toHaveLength(2);
    expect((where.AND as unknown[])[1]).toEqual({ OR: [{ birthDate: null }] });
  });

  it('keeps a status filter alongside a search', () => {
    const where = buildPeopleWhere({ search: 'Іван', status: PersonStatus.NEW });

    expect(where.status).toBe(PersonStatus.NEW);
    expect(where.AND).toHaveLength(1);
  });
});

describe('buildPeopleOrderBy', () => {
  it('defaults to the newest additions first', () => {
    expect(buildPeopleOrderBy()).toEqual([{ createdAt: 'desc' }]);
  });

  it('starts other columns ascending — alphabetical, or smallest first', () => {
    expect(buildPeopleOrderBy('city')).toEqual([{ city: { sort: 'asc', nulls: 'last' } }]);
    expect(buildPeopleOrderBy('memberSince', 'desc')).toEqual([
      { memberSince: { sort: 'desc', nulls: 'last' } },
    ]);
  });

  it('sorts a name by surname, then by first name', () => {
    expect(buildPeopleOrderBy('name', 'asc')).toEqual([
      { lastName: { sort: 'asc', nulls: 'last' } },
      { firstName: 'asc' },
    ]);
  });

  it('needs no nulls rule for a column that is always filled', () => {
    expect(buildPeopleOrderBy('status', 'asc')).toEqual([{ status: 'asc' }]);
  });

  it('turns age around, because the oldest person was born first', () => {
    expect(buildPeopleOrderBy('age', 'asc')).toEqual([
      { birthDate: { sort: 'desc', nulls: 'last' } },
    ]);
  });

  it('sorts birthdays by day and month, ignoring the year', () => {
    expect(buildPeopleOrderBy('birthday', 'asc')).toEqual([
      { birthMd: { sort: 'asc', nulls: 'last' } },
    ]);
  });

  it('sorts a home group by its name', () => {
    expect(buildPeopleOrderBy('homeGroup', 'desc')).toEqual([{ homeGroup: { name: 'desc' } }]);
  });
});

describe('PersonService stats', () => {
  it('counts people who belong to at least one community', async () => {
    const count = jest
      .fn()
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    const service = new PersonService({ person: { count } } as unknown as PrismaService);

    await expect(service.stats()).resolves.toMatchObject({
      total: 10,
      inCommunity: 4,
      newThisMonth: 2,
      needsAction: 1,
    });
    expect(count).toHaveBeenNthCalledWith(2, { where: { communities: { some: {} } } });
  });
});
