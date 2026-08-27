import { PersonStatus } from '@/infra/prisma/prisma.service';

import { buildPeopleWhere, toPersonData } from './person.service';

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
});

describe('buildPeopleWhere', () => {
  it('is empty when nothing is filtered', () => {
    expect(buildPeopleWhere({})).toEqual({});
  });

  it('matches a status, community and ministry exactly', () => {
    expect(
      buildPeopleWhere({
        status: PersonStatus.SERVING,
        community: 'Молодь',
        ministry: 'Прославлення',
      }),
    ).toEqual({ status: PersonStatus.SERVING, community: 'Молодь', ministry: 'Прославлення' });
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

  it('keeps a status filter alongside a search', () => {
    const where = buildPeopleWhere({ search: 'Іван', status: PersonStatus.NEW });

    expect(where.status).toBe(PersonStatus.NEW);
    expect(where.AND).toHaveLength(1);
  });
});
