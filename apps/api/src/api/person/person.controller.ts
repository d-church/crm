import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessService } from '@/api/access/access.service';
import { ActivityService } from '@/api/activity/activity.service';
import type { Actor } from '@/api/activity/activity.service';
import type { Viewer } from '@/api/access/visibility';
import { Authorization, CurrentActor, CurrentViewer } from '@/common/decorators';
import { Role } from '@/infra/prisma/prisma.service';

import { BulkPeopleDto } from './dto/bulk-people.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { FindPeopleDto } from './dto/find-people.dto';
import { PeopleStatsDto } from './dto/people-stats.dto';
import { SignalDto } from './dto/signal.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('People')
@Controller('people')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private readonly activityService: ActivityService,
    private readonly accessService: AccessService,
  ) {}

  @Authorization()
  @ApiOperation({ summary: 'List people — filtered, sorted and paginated' })
  @Get()
  public findAll(@Query() query: FindPeopleDto, @CurrentViewer() viewer: Viewer) {
    return this.personService.findAll(query, viewer);
  }

  /** Лідер людей не заводить: це рідка операція, для неї є адмін і команда конекту. */
  @Authorization(Role.SUPERADMIN, Role.ADMIN, Role.CONNECT)
  @ApiOperation({ summary: 'Add a person' })
  @Post()
  public create(@Body() createPersonDto: CreatePersonDto, @CurrentActor() actor: Actor) {
    return this.personService.create(createPersonDto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Ідентифікатори всіх людей за поточним фільтром' })
  @Get('ids')
  public findIds(@Query() query: FindPeopleDto, @CurrentViewer() viewer: Viewer) {
    return this.personService.findIds(query, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Одна дія над багатьма людьми одразу' })
  @Post('bulk')
  public bulk(
    @Body() dto: BulkPeopleDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.personService.bulk(dto, actor, viewer);
  }

  // Both of these must stay above `:id`, or that route swallows them.
  @Authorization()
  @ApiOperation({ summary: 'Лічильники в межах видимості користувача' })
  @Get('stats')
  public stats(@Query() query: PeopleStatsDto, @CurrentViewer() viewer: Viewer) {
    return this.personService.stats(query.includeInactive ?? false, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Slim list of people for relation pickers' })
  @Get('choices')
  public choices(@CurrentViewer() viewer: Viewer) {
    return this.personService.choices(viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Хронологія людини: події життя і операції з карткою' })
  @Get(':id/timeline')
  public async timeline(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    // Хронологія показує пасторські сліди — зміни нотаток, спілкування, кроки.
    await this.accessService.assertPastoral(id, viewer);

    return this.activityService.timeline(id);
  }

  /** Доступно тому, хто бачить людину: у цьому й сенс — лідер сигналить, не читаючи. */
  @Authorization()
  @ApiOperation({ summary: 'Передати людину попечителю: позначка уваги і запис для нього' })
  @Post(':id/signal')
  @HttpCode(HttpStatus.NO_CONTENT)
  public signal(
    @Param('id') id: string,
    @Body() dto: SignalDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.personService.signal(id, dto.note, actor, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Get a single person by id' })
  @Get(':id')
  public findOne(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.personService.findOne(id, viewer);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a person' })
  @Patch(':id')
  public update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @CurrentActor() actor: Actor,
    @CurrentViewer() viewer: Viewer,
  ) {
    return this.personService.update(id, updatePersonDto, actor, viewer);
  }

  /** Видалення людини лишається за адмінами — лідер картку не прибирає. */
  @Authorization(Role.SUPERADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Remove a person' })
  @Delete(':id')
  public remove(@Param('id') id: string, @CurrentViewer() viewer: Viewer) {
    return this.personService.remove(id, viewer);
  }
}
