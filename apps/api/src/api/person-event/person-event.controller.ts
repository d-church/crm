import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessService } from '@/api/access/access.service';
import type { Viewer } from '@/api/access/visibility';
import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor, CurrentViewer } from '@/common/decorators';

import { CreatePersonEventDto, UpdatePersonEventDto } from './dto/person-event.dto';
import { PersonEventService } from './person-event.service';

@ApiTags('Person events')
@Controller('people/:personId/events')
export class PersonEventController {
  constructor(
    private readonly personEventService: PersonEventService,
    private readonly accessService: AccessService,
  ) {}

  @Authorization()
  @ApiOperation({ summary: 'Події людини, внесені руками' })
  @Get()
  public async findForPerson(@Param('personId') personId: string, @CurrentViewer() viewer: Viewer) {
    await this.accessService.assertPastoral(personId, viewer);

    return this.personEventService.findForPerson(personId);
  }

  @Authorization()
  @ApiOperation({ summary: 'Додати подію: назва і дата' })
  @Post()
  public async create(
    @Param('personId') personId: string,
    @Body() dto: CreatePersonEventDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    await this.accessService.assertPastoral(personId, viewer);

    return this.personEventService.create(personId, dto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Змінити подію' })
  @Patch(':id')
  public async update(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePersonEventDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    await this.accessService.assertPastoral(personId, viewer);

    return this.personEventService.update(personId, id, dto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Прибрати подію' })
  @Delete(':id')
  public async remove(
    @Param('personId') personId: string,
    @Param('id') id: string,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    await this.accessService.assertPastoral(personId, viewer);

    return this.personEventService.remove(personId, id, actor);
  }
}
