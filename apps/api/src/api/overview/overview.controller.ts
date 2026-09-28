import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Viewer } from '@/api/access/visibility';
import { Authorization, CurrentViewer } from '@/common/decorators';

import { OverviewService } from './overview.service';

@ApiTags('Overview')
@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Authorization()
  @ApiOperation({ summary: 'Стартова сторінка: підопічні, команди, найближче до роботи' })
  @Get()
  public forViewer(@CurrentViewer() viewer: Viewer) {
    return this.overviewService.forViewer(viewer);
  }
}
