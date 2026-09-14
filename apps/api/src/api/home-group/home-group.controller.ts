import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreateHomeGroupDto } from './dto/create-home-group.dto';
import { UpdateHomeGroupDto } from './dto/update-home-group.dto';
import { HomeGroupService } from './home-group.service';

@ApiTags('Home groups')
@Controller('home-groups')
export class HomeGroupController {
  constructor(private readonly homeGroupService: HomeGroupService) {}

  @Authorization()
  @ApiOperation({ summary: 'List home groups with their people counts and leaders' })
  @Get()
  public findAll() {
    return this.homeGroupService.findAll();
  }

  @Authorization()
  @ApiOperation({ summary: 'Get home group details' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.homeGroupService.findOne(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Create a home group' })
  @Post()
  public create(@Body() dto: CreateHomeGroupDto) {
    return this.homeGroupService.create(dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a home group' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateHomeGroupDto) {
    return this.homeGroupService.update(id, dto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Delete a home group and clear its memberships' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.homeGroupService.remove(id);
  }
}
