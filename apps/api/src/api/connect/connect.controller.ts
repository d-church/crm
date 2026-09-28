import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Viewer } from '@/api/access/visibility';
import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor, CurrentViewer } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import { ConnectService } from './connect.service';
import { HandoverDto, QuickAddDto } from './dto/connect.dto';

@ApiTags('Connect')
@Controller('connect')
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.CONNECT)
  @ApiOperation({ summary: 'Борда нових людей своєї спільноти' })
  @Get('board')
  public board(@CurrentViewer() viewer: Viewer) {
    return this.connectService.board(viewer);
  }

  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.CONNECT)
  @ApiOperation({ summary: 'Завести людину за пів хвилини: імʼя і захід' })
  @Post('people')
  public quickAdd(
    @Body() dto: QuickAddDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.connectService.quickAdd(dto, actor, viewer);
  }

  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.CONNECT)
  @ApiOperation({ summary: 'Передати людину колезі — разом з фолов-апом і веденням' })
  @Patch('board/:personId/handover')
  public handover(
    @Param('personId') personId: string,
    @Body() dto: HandoverDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.connectService.handover(personId, dto, actor, viewer);
  }
}
