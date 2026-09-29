import { Module } from '@nestjs/common';

import { GatheringTypeController } from './gathering-type.controller';
import { GatheringTypeService } from './gathering-type.service';

@Module({
  controllers: [GatheringTypeController],
  providers: [GatheringTypeService],
})
export class GatheringTypeModule {}
