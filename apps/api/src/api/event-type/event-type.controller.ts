import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import { CreateEventTypeDto, ReorderEventTypesDto, UpdateEventTypeDto } from './dto/event-type.dto';
import { EventTypeService } from './event-type.service';

@ApiTags('Event types')
@Controller('event-types')
export class EventTypeController {
  constructor(private readonly eventTypeService: EventTypeService) {}

  @Authorization()
  @ApiOperation({ summary: 'Довідник заходів' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @Get()
  public findAll(@Query('includeArchived') includeArchived?: string) {
    return this.eventTypeService.findAll(includeArchived === 'true');
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Додати захід' })
  @Post()
  public create(@Body() dto: CreateEventTypeDto) {
    return this.eventTypeService.create(dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Перейменувати або заархівувати захід' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateEventTypeDto) {
    return this.eventTypeService.update(id, dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Порядок заходів' })
  @Post('reorder')
  public reorder(@Body() dto: ReorderEventTypesDto) {
    return this.eventTypeService.reorder(dto);
  }

  @Authorization(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Видалити захід, якого ще немає в подіях' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.eventTypeService.remove(id);
  }
}
