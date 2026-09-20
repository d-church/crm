import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreateMinistryDto } from './dto/create-ministry.dto';
import { FindMinistriesDto } from './dto/find-ministries.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { MinistryService } from './ministry.service';

@ApiTags('Ministries')
@Controller('ministries')
export class MinistryController {
  constructor(private readonly ministryService: MinistryService) {}

  @Authorization()
  @ApiOperation({ summary: 'List ministries with optional communities, people counts and leaders' })
  @Get()
  public findAll(@Query() query: FindMinistriesDto) {
    return this.ministryService.findAll(query);
  }

  @Authorization()
  @ApiOperation({ summary: 'Get ministry details' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.ministryService.findOne(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Create a ministry' })
  @Post()
  public create(@Body() dto: CreateMinistryDto) {
    return this.ministryService.create(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a ministry' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateMinistryDto) {
    return this.ministryService.update(id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Delete a ministry and clear its memberships' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.ministryService.remove(id);
  }
}
