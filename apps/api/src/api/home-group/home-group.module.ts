import { Module } from '@nestjs/common';

import { HomeGroupController } from './home-group.controller';
import { HomeGroupService } from './home-group.service';

@Module({
  controllers: [HomeGroupController],
  providers: [HomeGroupService],
})
export class HomeGroupModule {}
