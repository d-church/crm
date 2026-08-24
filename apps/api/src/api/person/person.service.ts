import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService, PersonModel } from '@/infra/prisma/prisma.service';

import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonService {
  constructor(private readonly prismaService: PrismaService) {}

  public async create(createPersonDto: CreatePersonDto): Promise<Person> {
    return this.prismaService.person.create({
      data: toPersonData(createPersonDto),
    });
  }

  public async findAll(): Promise<Person[]> {
    return this.prismaService.person.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  public async findOne(id: string): Promise<Person> {
    const person = await this.prismaService.person.findUnique({ where: { id } });
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    return person;
  }

  public async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    await this.findOne(id);

    return this.prismaService.person.update({
      where: { id },
      data: toPersonData(updatePersonDto),
    });
  }

  public async remove(id: string): Promise<Person> {
    await this.findOne(id);

    return this.prismaService.person.delete({ where: { id } });
  }
}

/** Dates arrive as ISO strings from the DTO; Prisma wants `Date` (or null to clear). */
const toPersonData = <T extends UpdatePersonDto>({ birthDate, joinedAt, ...rest }: T) => ({
  ...rest,
  ...(birthDate === undefined ? {} : { birthDate: new Date(birthDate) }),
  ...(joinedAt === undefined ? {} : { joinedAt: new Date(joinedAt) }),
});

export type Person = PersonModel;
