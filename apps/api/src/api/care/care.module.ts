import { Module } from '@nestjs/common';

import { ActivityModule } from '@/api/activity/activity.module';

import { CareController } from './care.controller';
import { CareService } from './care.service';

@Module({
  imports: [ActivityModule],
  controllers: [CareController],
  providers: [CareService],
  exports: [CareService],
})
export class CareModule {}
