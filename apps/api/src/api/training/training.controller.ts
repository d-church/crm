import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingService } from './training.service';

@ApiTags('Trainings')
@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Authorization()
  @ApiOperation({ summary: 'List trainings with their people counts and leaders' })
  @Get()
  public findAll() {
    return this.trainingService.findAll();
  }

  @Authorization()
  @ApiOperation({ summary: 'Get training details' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Create a training' })
  @Post()
  public create(@Body() dto: CreateTrainingDto) {
    return this.trainingService.create(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a training' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateTrainingDto) {
    return this.trainingService.update(id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Delete a training and clear its completions' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.trainingService.remove(id);
  }
}
