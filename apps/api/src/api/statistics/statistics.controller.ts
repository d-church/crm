import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Viewer } from '@/api/access/visibility';
import { Authorization, CurrentViewer } from '@/common/decorators';

import { StatisticsQueryDto } from './dto/statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Authorization()
  @ApiOperation({ summary: 'Цифри про церкву: вік, склад, залученість, рух за рік' })
  @Get()
  public forViewer(@CurrentViewer() viewer: Viewer, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.forViewer(viewer, query.segment);
  }
}
