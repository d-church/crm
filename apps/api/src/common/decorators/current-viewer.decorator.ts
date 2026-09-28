import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from '@/api/user/user.service';
import type { Viewer } from '@/api/access/visibility';

/**
 * Хто питає — у вигляді, який розуміє модуль видимості. Ролі й області вже приїхали
 * разом з автентифікованим користувачем, тож зайвого запиту в базу тут немає.
 */
export const toViewer = (user: AuthUser): Viewer => ({
  id: user.id,
  personId: user.personId,
  roles: user.roles,
  scopes: user.scopes.map(({ communityId, homeGroupId, ministryId, trainingId }) => ({
    communityId,
    homeGroupId,
    ministryId,
    trainingId,
  })),
});

export const CurrentViewer = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
  toViewer(ctx.switchToHttp().getRequest<Request>().user as AuthUser),
);
