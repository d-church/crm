import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { CommunityModule } from '@/api/community/community.module';
import { PersonModule } from '@/api/person/person.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [AuthModule, CommunityModule, PersonModule, UserModule],
})
export class ApiModule {}
