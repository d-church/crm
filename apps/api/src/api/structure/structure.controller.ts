import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Viewer } from '@/api/access/visibility';
import { Authorization, CurrentViewer } from '@/common/decorators';

import { STRUCTURE_KINDS, StructureService, type StructureKind } from './structure.service';

@ApiTags('Structure')
@Controller('structure')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Authorization()
  @ApiOperation({ summary: 'Імена учасників спільноти, групи, служіння чи навчання' })
  @Get(':kind/:id/people')
  public peopleOf(
    @Param('kind') kind: string,
    @Param('id') id: string,
    @CurrentViewer() viewer: Viewer,
  ) {
    if (!(STRUCTURE_KINDS as readonly string[]).includes(kind)) {
      throw new BadRequestException('Невідома частина структури');
    }

    return this.structureService.peopleOf(kind as StructureKind, id, viewer);
  }
}
