import { Module } from '@nestjs/common';

import { PersonEventController } from './person-event.controller';
import { PersonEventService } from './person-event.service';

@Module({
  controllers: [PersonEventController],
  providers: [PersonEventService],
  exports: [PersonEventService],
})
export class PersonEventModule {}
