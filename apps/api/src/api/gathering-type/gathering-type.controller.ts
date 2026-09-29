import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import {
  CreateGatheringTypeDto,
  ReorderGatheringTypesDto,
  UpdateGatheringTypeDto,
} from './dto/gathering-type.dto';
import { GatheringTypeService } from './gathering-type.service';

@ApiTags('Gathering types')
@Controller('gathering-types')
export class GatheringTypeController {
  constructor(private readonly gatheringTypeService: GatheringTypeService) {}

  @Authorization()
  @ApiOperation({ summary: 'Довідник видів зібрань' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @Get()
  public findAll(@Query('includeArchived') includeArchived?: string) {
    return this.gatheringTypeService.findAll(includeArchived === 'true');
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Додати вид зібрання' })
  @Post()
  public create(@Body() dto: CreateGatheringTypeDto) {
    return this.gatheringTypeService.create(dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Перейменувати або заархівувати вид' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateGatheringTypeDto) {
    return this.gatheringTypeService.update(id, dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Порядок видів' })
  @Post('reorder')
  public reorder(@Body() dto: ReorderGatheringTypesDto) {
    return this.gatheringTypeService.reorder(dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Видалити вид, якого ще немає в зібраннях' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.gatheringTypeService.remove(id);
  }
}
