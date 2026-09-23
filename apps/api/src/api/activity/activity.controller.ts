import { Body, Controller, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import { ActivityService } from './activity.service';
import { DeleteActivitiesDto } from './dto/delete-activities.dto';

@ApiTags('Activity')
@Controller('people/:personId/activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Прибрати записи журналу — доступно лише суперадміну' })
  @Delete()
  public remove(@Param('personId') personId: string, @Body() dto: DeleteActivitiesDto) {
    return this.activityService.remove(personId, dto.ids);
  }
}
