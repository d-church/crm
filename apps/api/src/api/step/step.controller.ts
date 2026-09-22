import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreateStepDto } from './dto/create-step.dto';
import { CreateStepTypeDto, ReorderStepTypesDto, UpdateStepTypeDto } from './dto/step-type.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepService } from './step.service';

@ApiTags('Steps')
@Controller()
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Authorization()
  @ApiOperation({ summary: 'Довідник кроків зростання' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  @Get('step-types')
  public findTypes(@Query('includeArchived') includeArchived?: string) {
    return this.stepService.findTypes(includeArchived === 'true');
  }

  @Authorization()
  @ApiOperation({ summary: 'Додати крок у довідник' })
  @Post('step-types')
  public createType(@Body() dto: CreateStepTypeDto) {
    return this.stepService.createType(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Перейменувати або заархівувати крок довідника' })
  @Patch('step-types/:id')
  public updateType(@Param('id') id: string, @Body() dto: UpdateStepTypeDto) {
    return this.stepService.updateType(id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Задати порядок кроків' })
  @Post('step-types/reorder')
  public reorderTypes(@Body() dto: ReorderStepTypesDto) {
    return this.stepService.reorderTypes(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Видалити крок довідника, якщо він нікому не призначений' })
  @Delete('step-types/:id')
  public removeType(@Param('id') id: string) {
    return this.stepService.removeType(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Кроки людини, разом із завершеними' })
  @Get('people/:personId/steps')
  public findForPerson(@Param('personId') personId: string) {
    return this.stepService.findForPerson(personId);
  }

  @Authorization()
  @ApiOperation({ summary: 'Призначити людині крок' })
  @Post('people/:personId/steps')
  public create(@Param('personId') personId: string, @Body() dto: CreateStepDto) {
    return this.stepService.create(personId, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Змінити крок: стан, дедлайн, відповідального' })
  @Patch('people/:personId/steps/:id')
  public update(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.stepService.update(personId, id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Прибрати крок' })
  @Delete('people/:personId/steps/:id')
  public remove(@Param('personId') personId: string, @Param('id') id: string) {
    return this.stepService.remove(personId, id);
  }
}
