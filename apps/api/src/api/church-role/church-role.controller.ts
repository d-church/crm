import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor } from '@/common/decorators';

import { ChurchRoleService } from './church-role.service';
import {
  CreateChurchRoleDto,
  CreateChurchRoleTypeDto,
  ReorderChurchRoleTypesDto,
  UpdateChurchRoleDto,
  UpdateChurchRoleTypeDto,
} from './dto/church-role.dto';

@ApiTags('Church roles')
@Controller()
export class ChurchRoleController {
  constructor(private readonly churchRoleService: ChurchRoleService) {}

  @Authorization()
  @ApiOperation({ summary: 'Довідник санів' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @Get('church-role-types')
  public findTypes(@Query('includeArchived') includeArchived?: string) {
    return this.churchRoleService.findTypes(includeArchived === 'true');
  }

  @Authorization()
  @ApiOperation({ summary: 'Додати сан у довідник' })
  @Post('church-role-types')
  public createType(@Body() dto: CreateChurchRoleTypeDto) {
    return this.churchRoleService.createType(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Перейменувати або заархівувати сан' })
  @Patch('church-role-types/:id')
  public updateType(@Param('id') id: string, @Body() dto: UpdateChurchRoleTypeDto) {
    return this.churchRoleService.updateType(id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Задати порядок санів' })
  @Post('church-role-types/reorder')
  public reorderTypes(@Body() dto: ReorderChurchRoleTypesDto) {
    return this.churchRoleService.reorderTypes(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Видалити сан, якщо він нікому не призначений' })
  @Delete('church-role-types/:id')
  public removeType(@Param('id') id: string) {
    return this.churchRoleService.removeType(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Сани людини, разом із завершеними' })
  @Get('people/:personId/church-roles')
  public findForPerson(@Param('personId') personId: string) {
    return this.churchRoleService.findForPerson(personId);
  }

  @Authorization()
  @ApiOperation({ summary: 'Призначити людині сан' })
  @Post('people/:personId/church-roles')
  public create(
    @Param('personId') personId: string,
    @Body() dto: CreateChurchRoleDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.churchRoleService.create(personId, dto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Змінити період сану' })
  @Patch('people/:personId/church-roles/:id')
  public update(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChurchRoleDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.churchRoleService.update(personId, id, dto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Прибрати сан' })
  @Delete('people/:personId/church-roles/:id')
  public remove(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
  ) {
    return this.churchRoleService.remove(personId, id, actor);
  }
}
