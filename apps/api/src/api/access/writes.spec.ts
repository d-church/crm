import { ForbiddenException } from '@nestjs/common';

import { Role } from '@/infra/prisma/prisma.service';

import type { Viewer } from './visibility';
import {
  assertBulkActionAllowed,
  assertStructuralAllowed,
  bulkTouchesPastoral,
  touchesPastoral,
} from './writes';

const leader: Viewer = {
  id: 'u1',
  personId: '00000000-0000-4000-8000-0000000000aa',
  roles: [Role.LEADER],
  scopes: [],
};
const admin: Viewer = { ...leader, roles: [Role.ADMIN] };
const pastor: Viewer = { ...leader, roles: [Role.ADMIN, Role.PASTOR] };

describe('assertStructuralAllowed', () => {
  it('не дає лідеру перенести людину в іншу домашню групу', () => {
    expect(() => assertStructuralAllowed(leader, { homeGroupId: 'g1' })).toThrow(
      ForbiddenException,
    );
  });

  it('не дає лідеру дописати людину в служіння', () => {
    expect(() =>
      assertStructuralAllowed(leader, { ministries: [{ ministryId: 'm1', role: 'MEMBER' }] }),
    ).toThrow(ForbiddenException);
  });

  it('пропускає лідера, коли структури правка не чіпає', () => {
    expect(() => assertStructuralAllowed(leader, { notes: 'поговорили' })).not.toThrow();
  });

  it('не заважає адміну', () => {
    expect(() => assertStructuralAllowed(admin, { homeGroupId: 'g1' })).not.toThrow();
  });

  it('не зважає на поля, яких у правці немає', () => {
    expect(() =>
      assertStructuralAllowed(leader, { homeGroupId: undefined, phone: '067' }),
    ).not.toThrow();
  });
});

describe('touchesPastoral', () => {
  it.each(['notes', 'careNeeded', 'membership', 'activity', 'address', 'email'])(
    'вимагає опіки для поля %s',
    (field) => {
      expect(touchesPastoral(leader, { [field]: 'x' })).toBe(true);
    },
  );

  it('не вимагає опіки для командних полів', () => {
    expect(touchesPastoral(leader, { phone: '067', lastSeenAt: '2026-09-01' })).toBe(false);
  });

  it.each(['membership', 'activity', 'address', 'email', 'baptizedAt'])(
    'не вимагає опіки від адміна для облікового поля %s',
    (field) => {
      expect(touchesPastoral(admin, { [field]: 'x' })).toBe(false);
    },
  );

  it.each(['notes', 'careNeeded', 'maritalStatus', 'orphanStatus'])(
    'вимагає перевірки по людині навіть від адміна: %s',
    (field) => {
      expect(touchesPastoral(admin, { [field]: 'x' })).toBe(true);
    },
  );

  it('перевіряє пастора так само — ширшим його робить не роль, а видимість', () => {
    expect(touchesPastoral(pastor, { notes: 'x' })).toBe(true);
  });
});

describe('масові дії', () => {
  it.each(['community', 'homeGroup', 'ministry', 'training'])(
    'не дає лідеру переставляти людей списком: %s',
    (action) => {
      expect(() => assertBulkActionAllowed(leader, action)).toThrow(ForbiddenException);
    },
  );

  it('дозволяє лідеру пасторські дії — але лише над підопічними', () => {
    expect(() => assertBulkActionAllowed(leader, 'careNeeded')).not.toThrow();
    expect(bulkTouchesPastoral(leader, 'careNeeded')).toBe(true);
  });

  it('дає адміну переставляти людей списком', () => {
    expect(() => assertBulkActionAllowed(admin, 'homeGroup')).not.toThrow();
    expect(bulkTouchesPastoral(admin, 'homeGroup')).toBe(false);
  });

  it.each(['careNeeded', 'step'])(
    'звужує пасторську дію списком до підопічних навіть адміну: %s',
    (action) => {
      expect(bulkTouchesPastoral(admin, action)).toBe(true);
    },
  );

  it('лишає адміну облікові дії списком без опіки', () => {
    expect(bulkTouchesPastoral(admin, 'membership')).toBe(false);
    expect(bulkTouchesPastoral(admin, 'churchRole')).toBe(false);
  });
});
