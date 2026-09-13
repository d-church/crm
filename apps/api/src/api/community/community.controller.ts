import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@ApiTags('Communities')
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Authorization()
  @ApiOperation({ summary: 'List communities with their people counts' })
  @Get()
  public findAll() {
    return this.communityService.findAll();
  }

  @Authorization()
  @ApiOperation({ summary: 'Get community details with its people count' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.communityService.findOne(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Create a community' })
  @Post()
  public create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communityService.create(createCommunityDto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a community' })
  @Patch(':id')
  public update(@Param('id') id: string, @Body() updateCommunityDto: UpdateCommunityDto) {
    return this.communityService.update(id, updateCommunityDto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Delete a community and remove its memberships' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.communityService.remove(id);
  }
}
