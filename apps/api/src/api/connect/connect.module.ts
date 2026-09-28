import { Module } from '@nestjs/common';

import { ActivityModule } from '@/api/activity/activity.module';

import { ConnectController } from './connect.controller';
import { ConnectService } from './connect.service';

@Module({
  imports: [ActivityModule],
  controllers: [ConnectController],
  providers: [ConnectService],
})
export class ConnectModule {}
