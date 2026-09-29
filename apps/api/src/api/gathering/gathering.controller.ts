import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Viewer } from '@/api/access/visibility';
import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor, CurrentViewer } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import {
  CreateGatheringDto,
  FindGatheringsDto,
  MarkAttendanceDto,
  UpdateGatheringDto,
} from './dto/gathering.dto';
import { GatheringService } from './gathering.service';

@ApiTags('Gatherings')
@Controller('gatherings')
export class GatheringController {
  constructor(private readonly gatheringService: GatheringService) {}

  @Authorization()
  @ApiOperation({ summary: 'Календар зібрань за проміжком дат' })
  @Get()
  public findAll(@Query() query: FindGatheringsDto, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.findAll(query, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Одне зібрання' })
  @Get(':id')
  public findOne(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.findOne(id, viewer);
  }

  /** Лідер створює зібрання у своїй області; загальноцерковне — лише адмін. */
  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.LEADER)
  @ApiOperation({ summary: 'Створити зібрання або серію наперед' })
  @Post()
  public create(@Body() dto: CreateGatheringDto, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.create(dto, viewer);
  }

  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.LEADER)
  @ApiOperation({ summary: 'Змінити зібрання' })
  @Patch(':id')
  public update(
    @Param('id') id: string,
    @Body() dto: UpdateGatheringDto,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.gatheringService.update(id, dto, viewer);
  }

  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.LEADER)
  @ApiOperation({ summary: 'Прибрати зібрання разом з відмітками' })
  @Delete(':id')
  public remove(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.remove(id, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Кого користувач може відмітити на цьому зібранні' })
  @Get(':id/roster')
  public roster(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.roster(id, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Хто був і кого не було — серед видимих користувачу людей' })
  @Get(':id/attendance')
  public attendance(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.gatheringService.attendance(id, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Проставити відмітки пачкою' })
  @Post(':id/attendance')
  public mark(
    @Param('id') id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentViewer() viewer: Viewer,
    @CurrentActor() actor: Actor,
  ) {
    return this.gatheringService.mark(id, dto, viewer, actor);
  }
}
