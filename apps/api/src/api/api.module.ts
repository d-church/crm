import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { CommunityModule } from '@/api/community/community.module';
import { HomeGroupModule } from '@/api/home-group/home-group.module';
import { PersonModule } from '@/api/person/person.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [AuthModule, CommunityModule, HomeGroupModule, PersonModule, UserModule],
})
export class ApiModule {}
