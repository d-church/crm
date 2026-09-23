import type { User } from '@/api/user/user.service';
import { Role } from '@/infra/prisma/prisma.service';

import { SYSTEM_ACTOR_NAME, toActor } from './current-actor.decorator';

const user = (role: Role): User =>
  ({ id: 'u1', firstName: 'Андрій', lastName: 'Татач', role }) as User;

describe('toActor', () => {
  it('signs operations with the person doing them', () => {
    expect(toActor(user(Role.SUPERADMIN), false)).toEqual({ id: 'u1', name: 'Андрій Татач' });
  });

  it('lets a superadmin sign as the system', () => {
    expect(toActor(user(Role.SUPERADMIN), true)).toEqual({ id: 'u1', name: SYSTEM_ACTOR_NAME });
  });

  it('ignores the flag for a plain admin', () => {
    expect(toActor(user(Role.ADMIN), true)).toEqual({ id: 'u1', name: 'Андрій Татач' });
  });

  it('keeps the real author even when the journal shows the system', () => {
    expect(toActor(user(Role.SUPERADMIN), true).id).toBe('u1');
  });
});
