import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ActivityService } from '@/api/activity/activity.service';
import type { Actor } from '@/api/activity/activity.service';
import { Authorization, CurrentActor } from '@/common/decorators';

import { BulkPeopleDto } from './dto/bulk-people.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { FindPeopleDto } from './dto/find-people.dto';
import { PeopleStatsDto } from './dto/people-stats.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('People')
@Controller('people')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private readonly activityService: ActivityService,
  ) {}

  @Authorization()
  @ApiOperation({ summary: 'List people — filtered, sorted and paginated' })
  @Get()
  public findAll(@Query() query: FindPeopleDto) {
    return this.personService.findAll(query);
  }

  @Authorization()
  @ApiOperation({ summary: 'Add a person' })
  @Post()
  public create(@Body() createPersonDto: CreatePersonDto, @CurrentActor() actor: Actor) {
    return this.personService.create(createPersonDto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Ідентифікатори всіх людей за поточним фільтром' })
  @Get('ids')
  public findIds(@Query() query: FindPeopleDto) {
    return this.personService.findIds(query);
  }

  @Authorization()
  @ApiOperation({ summary: 'Одна дія над багатьма людьми одразу' })
  @Post('bulk')
  public bulk(@Body() dto: BulkPeopleDto, @CurrentActor() actor: Actor) {
    return this.personService.bulk(dto, actor);
  }

  // Both of these must stay above `:id`, or that route swallows them.
  @Authorization()
  @ApiOperation({ summary: 'Totals for the whole base, ignoring filters' })
  @Get('stats')
  public stats(@Query() query: PeopleStatsDto) {
    return this.personService.stats(query.includeInactive);
  }

  @Authorization()
  @ApiOperation({ summary: 'Slim list of people for relation pickers' })
  @Get('choices')
  public choices() {
    return this.personService.choices();
  }

  @Authorization()
  @ApiOperation({ summary: 'Хронологія людини: події життя і операції з карткою' })
  @Get(':id/timeline')
  public timeline(@Param('id') id: string) {
    return this.activityService.timeline(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Get a single person by id' })
  @Get(':id')
  public findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Authorization()
  @ApiOperation({ summary: 'Update a person' })
  @Patch(':id')
  public update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.personService.update(id, updatePersonDto, actor);
  }

  @Authorization()
  @ApiOperation({ summary: 'Remove a person' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }
}
