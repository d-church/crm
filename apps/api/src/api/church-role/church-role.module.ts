import { Module } from '@nestjs/common';

import { ChurchRoleController } from './church-role.controller';
import { ChurchRoleService } from './church-role.service';

@Module({
  controllers: [ChurchRoleController],
  providers: [ChurchRoleService],
  exports: [ChurchRoleService],
})
export class ChurchRoleModule {}
