import { Module } from '@nestjs/common';

import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { PersonAvatarService } from './person-avatar.service';
import { AvatarCleanupService } from './avatar-cleanup.service';
import { AvatarStorage } from './avatar-storage.service';

@Module({
  controllers: [PersonController],
  providers: [PersonService, PersonAvatarService, AvatarCleanupService, AvatarStorage],
  exports: [PersonService],
})
export class PersonModule {}
