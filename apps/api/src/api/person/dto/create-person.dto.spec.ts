import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { QuickAddDto } from '@/api/connect/dto/connect.dto';
import { PersonGender } from '@/infra/prisma/prisma.service';

import { CreatePersonDto } from './create-person.dto';
import { UpdatePersonDto } from './update-person.dto';

const id = '00000000-0000-4000-8000-000000000001';

describe.each([
  { dto: CreatePersonDto, fields: { firstName: 'Марія', communityIds: [id] } },
  { dto: QuickAddDto, fields: { firstName: 'Марія', eventTypeId: id } },
])('$dto.name', ({ dto, fields }) => {
  it.each([undefined, null, '', 'OTHER'])('rejects gender %s on creation', async (gender) => {
    const input = plainToInstance<object, object>(dto, { ...fields, gender });

    await expect(validate(input)).resolves.toEqual([
      expect.objectContaining({ property: 'gender' }),
    ]);
  });

  it.each(Object.values(PersonGender))('accepts gender %s on creation', async (gender) => {
    const input = plainToInstance<object, object>(dto, { ...fields, gender });

    await expect(validate(input)).resolves.toHaveLength(0);
  });
});

describe('UpdatePersonDto', () => {
  it.each([{ firstName: 'Марія' }, { gender: null }])('accepts %j on update', async (fields) => {
    await expect(validate(plainToInstance(UpdatePersonDto, fields))).resolves.toHaveLength(0);
  });
});
