import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { User } from '@/api/user/user.service';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  public handleRequest<TUser = User>(_err: unknown, user: TUser | false): TUser | undefined {
    return user || undefined;
  }
}
