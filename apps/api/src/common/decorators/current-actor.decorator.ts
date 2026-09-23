import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { User } from '@/api/user/user.service';
import { Role } from '@/infra/prisma/prisma.service';

/** Імʼя, яким підписані операції, зроблені «від імені системи». */
export const SYSTEM_ACTOR_NAME = 'D.Church CRM';

export const ACT_AS_SYSTEM_HEADER = 'x-act-as-system';

/**
 * Хто підписує операцію в журналі. Суперадмін може працювати від імені системи —
 * тоді в журналі видно D.Church CRM, але справжній автор усе одно зберігається
 * в actorId, щоб відповідальність не губилась.
 */
export type Actor = { id: string | null; name: string };

/** Прапорець діє лише для суперадмінів: звичайний адмін підписується собою. */
export const toActor = (user: User, actAsSystem: boolean): Actor => ({
  id: user.id,
  name:
    actAsSystem && user.role === Role.SUPERADMIN
      ? SYSTEM_ACTOR_NAME
      : `${user.firstName} ${user.lastName}`.trim(),
});

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return toActor(request.user as User, request.header(ACT_AS_SYSTEM_HEADER) === 'true');
});
