import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';

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
  @ApiOperation({ summary: 'Create a community' })
  @Post()
  public create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communityService.create(createCommunityDto);
  }
}
