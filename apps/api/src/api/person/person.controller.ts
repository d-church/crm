import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreatePersonDto } from './dto/create-person.dto';
import { FindPeopleDto } from './dto/find-people.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('People')
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Authorization()
  @ApiOperation({ summary: 'List people — filtered, sorted and paginated' })
  @Get()
  public findAll(@Query() query: FindPeopleDto) {
    return this.personService.findAll(query);
  }

  @Authorization()
  @ApiOperation({ summary: 'Add a person' })
  @Post()
  public create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  // Both of these must stay above `:id`, or that route swallows them.
  @Authorization()
  @ApiOperation({ summary: 'Totals for the whole base, ignoring filters' })
  @Get('stats')
  public stats() {
    return this.personService.stats();
  }

  @Authorization()
  @ApiOperation({ summary: 'Distinct communities and ministries for the filter dropdowns' })
  @Get('options')
  public options() {
    return this.personService.options();
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
  public update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto);
  }

  @Authorization()
  @ApiOperation({ summary: 'Remove a person' })
  @Delete(':id')
  public remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }
}
