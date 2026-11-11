import { Module } from '@nestjs/common';

import { EmailModule } from '@/infra/email/email.module';
import { PrismaModule } from '@/infra/prisma/prisma.module';
import { RedisModule } from '@/infra/redis/redis.module';

@Module({
  imports: [EmailModule, PrismaModule, RedisModule],
})
export class InfraModule {}
