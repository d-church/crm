import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Authorization } from '@/common/decorators';

import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonService } from './person.service';

@ApiTags('People')
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Authorization()
  @ApiOperation({ summary: 'List everyone known to the church' })
  @Get()
  public findAll() {
    return this.personService.findAll();
  }

  @Authorization()
  @ApiOperation({ summary: 'Add a person' })
  @Post()
  public create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
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
