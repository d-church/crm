import { Module } from '@nestjs/common';

import { AuthModule } from '@/api/auth/auth.module';
import { PersonModule } from '@/api/person/person.module';
import { UserModule } from '@/api/user/user.module';

@Module({
  imports: [AuthModule, PersonModule, UserModule],
})
export class ApiModule {}
