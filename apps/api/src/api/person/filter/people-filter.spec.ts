import { BadRequestException } from '@nestjs/common';

import { PersonStatus } from '@/infra/prisma/prisma.service';

import {
  buildPeopleFilterWhere,
  MAX_FILTER_CONDITIONS,
  parsePeopleFilter,
  type PeopleFilterCondition,
} from './people-filter';

const COMMUNITY_ID = '00000000-0000-4000-8000-000000000001';

/** 23:30 in Lviv on 14 September — already the 15th there, still the 14th in UTC. */
const NOW = new Date('2026-09-14T21:30:00.000Z');

const whereFor = (condition: PeopleFilterCondition) =>
  buildPeopleFilterWhere(parsePeopleFilter({ conditions: [condition] }), NOW);

/** The single clause a one-condition `all` filter produces. */
const clauseFor = (condition: PeopleFilterCondition) => (whereFor(condition).AND as unknown[])[0];

const expectBadRequest = (input: unknown, message: string) => {
  expect(() => parsePeopleFilter(input)).toThrow(BadRequestException);
  expect(() => parsePeopleFilter(input)).toThrow(message);
};

describe('parsePeopleFilter', () => {
  it('accepts a JSON string and defaults match to all', () => {
    expect(
      parsePeopleFilter('{"conditions":[{"field":"status","operator":"in","value":["NEW"]}]}'),
    ).toEqual({
      match: 'all',
      conditions: [{ field: 'status', operator: 'in', value: ['NEW'] }],
    });
  });

  it('trims text values and drops duplicate list items', () => {
    expect(
      parsePeopleFilter({
        match: 'any',
        conditions: [
          { field: 'city', operator: 'contains', value: '  Львів ' },
          { field: 'status', operator: 'in', value: ['NEW', 'NEW'] },
        ],
      }).conditions,
    ).toEqual([
      { field: 'city', operator: 'contains', value: 'Львів' },
      { field: 'status', operator: 'in', value: ['NEW'] },
    ]);
  });

  it('rejects malformed JSON', () => {
    expectBadRequest('{nope', 'filter must be valid JSON');
  });

  it('rejects an unknown match', () => {
    expectBadRequest({ match: 'some', conditions: [] }, 'filter.match must be one of: all, any');
  });

  it('rejects an empty or oversized condition list', () => {
    expectBadRequest({ conditions: [] }, 'filter.conditions must be a non-empty array');

    const condition = { field: 'status', operator: 'in', value: ['NEW'] };

    expectBadRequest(
      { conditions: Array.from({ length: MAX_FILTER_CONDITIONS + 1 }, () => condition) },
      `at most ${MAX_FILTER_CONDITIONS} items`,
    );
  });

  it('rejects fields outside the allowlist, including inherited keys', () => {
    expectBadRequest(
      { conditions: [{ field: 'legacyId', operator: 'equals', value: '1' }] },
      'filter.conditions[0].field is not a filterable field',
    );
    expectBadRequest(
      { conditions: [{ field: 'toString', operator: 'equals', value: '1' }] },
      'is not a filterable field',
    );
  });

  it('rejects an operator the field kind does not support', () => {
    expectBadRequest(
      { conditions: [{ field: 'status', operator: 'contains', value: 'NEW' }] },
      'filter.conditions[0].operator must be one of: in, notIn, isEmpty, isNotEmpty',
    );
  });

  it('rejects emptiness checks on columns that are never empty', () => {
    expectBadRequest(
      { conditions: [{ field: 'status', operator: 'isEmpty' }] },
      'does not apply to status',
    );
  });

  it('rejects a value on an emptiness check', () => {
    expectBadRequest(
      { conditions: [{ field: 'city', operator: 'isEmpty', value: 'Львів' }] },
      'value must be omitted for isEmpty',
    );
  });

  it('rejects blank and overlong text', () => {
    expectBadRequest(
      { conditions: [{ field: 'city', operator: 'contains', value: '   ' }] },
      'must be a non-empty string',
    );
    expectBadRequest(
      { conditions: [{ field: 'city', operator: 'contains', value: 'x'.repeat(101) }] },
      'shorter than or equal to 100 characters',
    );
  });

  it('rejects enum values outside the enum', () => {
    expectBadRequest(
      { conditions: [{ field: 'status', operator: 'in', value: ['MEMBER'] }] },
      'must only contain: NEW',
    );
  });

  it('rejects relation ids that are not UUIDs', () => {
    expectBadRequest(
      { conditions: [{ field: 'communities', operator: 'in', value: ['1'] }] },
      'must only contain UUIDs',
    );
  });

  it('rejects impossible dates and reversed ranges', () => {
    expectBadRequest(
      { conditions: [{ field: 'birthDate', operator: 'on', value: '2026-02-30' }] },
      'must be a date in YYYY-MM-DD format',
    );
    expectBadRequest(
      {
        conditions: [
          { field: 'birthDate', operator: 'between', value: ['2026-09-10', '2026-09-01'] },
        ],
      },
      'must not start after it ends',
    );
  });

  it('rejects day counts and ages that are not whole numbers in range', () => {
    expectBadRequest(
      { conditions: [{ field: 'lastSeenAt', operator: 'withinLastDays', value: '30' }] },
      'must be an integer between 0 and 36500',
    );
    expectBadRequest(
      { conditions: [{ field: 'age', operator: 'atLeast', value: 131 }] },
      'must be an integer between 0 and 130',
    );
  });
});

describe('buildPeopleFilterWhere', () => {
  it('joins conditions with AND for all and OR for any', () => {
    const conditions = [
      { field: 'status', operator: 'in', value: ['NEW'] },
      { field: 'followUp', operator: 'in', value: ['NOT_DONE'] },
    ];

    expect(buildPeopleFilterWhere(parsePeopleFilter({ match: 'all', conditions }))).toEqual({
      AND: [{ status: { in: ['NEW'] } }, { followUp: { in: ['NOT_DONE'] } }],
    });
    expect(buildPeopleFilterWhere(parsePeopleFilter({ match: 'any', conditions }))).toEqual({
      OR: [{ status: { in: ['NEW'] } }, { followUp: { in: ['NOT_DONE'] } }],
    });
  });

  describe('text', () => {
    it('matches case-insensitively with LIKE wildcards escaped', () => {
      expect(clauseFor({ field: 'city', operator: 'contains', value: '100%_ok' })).toEqual({
        city: { contains: '100\\%\\_ok', mode: 'insensitive' },
      });
      expect(clauseFor({ field: 'city', operator: 'equals', value: 'Львів' })).toEqual({
        city: { equals: 'Львів', mode: 'insensitive' },
      });
    });

    it('keeps blanks in a negation of a nullable column', () => {
      expect(clauseFor({ field: 'city', operator: 'notContains', value: 'Львів' })).toEqual({
        OR: [{ NOT: { city: { contains: 'Львів', mode: 'insensitive' } } }, { city: null }],
      });
    });

    it('needs no null branch when the column is required', () => {
      expect(clauseFor({ field: 'firstName', operator: 'notEquals', value: 'Іван' })).toEqual({
        NOT: { firstName: { equals: 'Іван', mode: 'insensitive' } },
      });
    });

    it('reads every phone column as one field', () => {
      expect(clauseFor({ field: 'phone', operator: 'contains', value: '067' })).toEqual({
        OR: [
          { phone: { contains: '067', mode: 'insensitive' } },
          { homePhone: { contains: '067', mode: 'insensitive' } },
          { workPhone: { contains: '067', mode: 'insensitive' } },
        ],
      });
    });

    it('treats null and an empty string alike as empty', () => {
      expect(clauseFor({ field: 'email', operator: 'isEmpty' })).toEqual({
        OR: [{ email: null }, { email: '' }],
      });
      expect(clauseFor({ field: 'email', operator: 'isNotEmpty' })).toEqual({
        NOT: { OR: [{ email: null }, { email: '' }] },
      });
    });
  });

  describe('enum', () => {
    it('matches a set of values', () => {
      expect(clauseFor({ field: 'status', operator: 'notIn', value: ['INACTIVE'] })).toEqual({
        status: { notIn: ['INACTIVE'] },
      });
    });
  });

  describe('relations', () => {
    it('matches any or none of the chosen communities', () => {
      expect(clauseFor({ field: 'communities', operator: 'in', value: [COMMUNITY_ID] })).toEqual({
        communities: { some: { id: { in: [COMMUNITY_ID] } } },
      });
      expect(clauseFor({ field: 'communities', operator: 'notIn', value: [COMMUNITY_ID] })).toEqual(
        { communities: { none: { id: { in: [COMMUNITY_ID] } } } },
      );
      expect(clauseFor({ field: 'communities', operator: 'isEmpty' })).toEqual({
        communities: { none: {} },
      });
    });

    it('keeps people without a home group when excluding groups', () => {
      expect(clauseFor({ field: 'homeGroup', operator: 'notIn', value: [COMMUNITY_ID] })).toEqual({
        OR: [{ homeGroupId: { notIn: [COMMUNITY_ID] } }, { homeGroupId: null }],
      });
      expect(clauseFor({ field: 'homeGroup', operator: 'isEmpty' })).toEqual({
        homeGroupId: null,
      });
    });

    it('matches any or none of the selected ministries', () => {
      expect(clauseFor({ field: 'ministries', operator: 'in', value: [COMMUNITY_ID] })).toEqual({
        ministries: { some: { id: { in: [COMMUNITY_ID] } } },
      });
      expect(clauseFor({ field: 'ministries', operator: 'notIn', value: [COMMUNITY_ID] })).toEqual({
        ministries: { none: { id: { in: [COMMUNITY_ID] } } },
      });
      expect(clauseFor({ field: 'ministries', operator: 'isEmpty' })).toEqual({
        ministries: { none: {} },
      });
    });
  });

  describe('dates', () => {
    const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

    it('covers whole calendar days, ends inclusive', () => {
      expect(clauseFor({ field: 'baptizedAt', operator: 'on', value: '2026-09-01' })).toEqual({
        baptizedAt: { gte: day('2026-09-01'), lt: day('2026-09-02') },
      });
      expect(clauseFor({ field: 'baptizedAt', operator: 'before', value: '2026-09-01' })).toEqual({
        baptizedAt: { lt: day('2026-09-01') },
      });
      expect(clauseFor({ field: 'baptizedAt', operator: 'after', value: '2026-09-01' })).toEqual({
        baptizedAt: { gte: day('2026-09-02') },
      });
      expect(
        clauseFor({
          field: 'baptizedAt',
          operator: 'between',
          value: ['2026-09-01', '2026-09-30'],
        }),
      ).toEqual({ baptizedAt: { gte: day('2026-09-01'), lt: day('2026-10-01') } });
    });

    it("counts relative days from today in the church's time zone", () => {
      // NOW is the 15th in Lviv.
      expect(clauseFor({ field: 'lastSeenAt', operator: 'withinLastDays', value: 7 })).toEqual({
        lastSeenAt: { gte: day('2026-09-08'), lt: day('2026-09-16') },
      });
      expect(clauseFor({ field: 'lastSeenAt', operator: 'moreThanDaysAgo', value: 60 })).toEqual({
        lastSeenAt: { lt: day('2026-07-17') },
      });
      expect(clauseFor({ field: 'nextActionAt', operator: 'withinNextDays', value: 0 })).toEqual({
        nextActionAt: { gte: day('2026-09-15'), lt: day('2026-09-16') },
      });
    });

    it('checks for a missing date', () => {
      expect(clauseFor({ field: 'lastSeenAt', operator: 'isEmpty' })).toEqual({
        lastSeenAt: null,
      });
    });
  });

  describe('birthday', () => {
    it('matches whole months, ignoring the year', () => {
      expect(clauseFor({ field: 'birthday', operator: 'inMonths', value: [9] })).toEqual({
        birthMd: { gte: 900, lte: 999 },
      });
      expect(clauseFor({ field: 'birthday', operator: 'inMonths', value: [12, 1] })).toEqual({
        OR: [{ birthMd: { gte: 1200, lte: 1299 } }, { birthMd: { gte: 100, lte: 199 } }],
      });
    });

    it('counts the window forward from today', () => {
      // NOW is 15 September in Lviv.
      expect(clauseFor({ field: 'birthday', operator: 'withinNextDays', value: 7 })).toEqual({
        birthMd: { gte: 915, lte: 922 },
      });
      expect(clauseFor({ field: 'birthday', operator: 'withinNextDays', value: 0 })).toEqual({
        birthMd: { gte: 915, lte: 915 },
      });
    });

    it('continues in January when the window crosses the new year', () => {
      const december = new Date('2026-12-28T09:00:00.000Z');
      const where = buildPeopleFilterWhere(
        parsePeopleFilter({
          conditions: [{ field: 'birthday', operator: 'withinNextDays', value: 10 }],
        }),
        december,
      );

      expect((where.AND as unknown[])[0]).toEqual({
        OR: [{ birthMd: { gte: 1228 } }, { birthMd: { lte: 107 } }],
      });
    });

    it('covers 29 February in a non-leap year', () => {
      const february = new Date('2026-02-27T09:00:00.000Z');
      const where = buildPeopleFilterWhere(
        parsePeopleFilter({
          conditions: [{ field: 'birthday', operator: 'withinNextDays', value: 3 }],
        }),
        february,
      );

      // 27 Feb + 3 days is 2 March, and 29 February (229) sits inside that range.
      expect((where.AND as unknown[])[0]).toEqual({ birthMd: { gte: 227, lte: 302 } });
    });

    it('asks only whether a birth date is known', () => {
      expect(clauseFor({ field: 'birthday', operator: 'isEmpty' })).toEqual({ birthMd: null });
    });

    it('rejects months outside 1–12', () => {
      expectBadRequest(
        { conditions: [{ field: 'birthday', operator: 'inMonths', value: [13] }] },
        'must be an integer between 1 and 12',
      );
    });

    it('keeps the birth date itself on absolute comparisons only', () => {
      expectBadRequest(
        { conditions: [{ field: 'birthDate', operator: 'withinLastDays', value: 7 }] },
        'filter.conditions[0].operator must be one of: on, before, after, between, isEmpty, isNotEmpty',
      );
    });
  });

  describe('age', () => {
    it('turns an age range into a birth-date interval', () => {
      const birthDate = (
        clauseFor({ field: 'age', operator: 'between', value: [18, 30] }) as {
          birthDate: { not: null; lte: Date; gt: Date };
        }
      ).birthDate;

      expect(birthDate).toEqual({
        not: null,
        lte: new Date('2008-09-14T21:30:00.000Z'),
        gt: new Date('1995-09-14T21:30:00.000Z'),
      });
    });

    it('matches an exact age', () => {
      expect(clauseFor({ field: 'age', operator: 'equals', value: 30 })).toEqual({
        birthDate: {
          not: null,
          lte: new Date('1996-09-14T21:30:00.000Z'),
          gt: new Date('1995-09-14T21:30:00.000Z'),
        },
      });
    });

    it('finds people whose age is unknown', () => {
      expect(clauseFor({ field: 'age', operator: 'isEmpty' })).toEqual({ birthDate: null });
    });
  });

  it('works with the enum values Prisma generates', () => {
    expect(whereFor({ field: 'status', operator: 'in', value: [PersonStatus.CARE] })).toEqual({
      AND: [{ status: { in: ['CARE'] } }],
    });
  });
});
