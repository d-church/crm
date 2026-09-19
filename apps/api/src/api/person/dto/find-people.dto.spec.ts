import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { FindPeopleDto } from './find-people.dto';

describe('FindPeopleDto', () => {
  it('accepts a canonical PostgreSQL UUID from legacy community data', async () => {
    const dto = new FindPeopleDto();
    dto.communityId = '185a2b20-b3ba-5b0e-de61-e66ce7c3e470';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects a malformed community id', async () => {
    const dto = new FindPeopleDto();
    dto.communityId = 'not-a-uuid';

    await expect(validate(dto)).resolves.toHaveLength(1);
  });

  it('parses the JSON condition filter from the query string', async () => {
    const dto = plainToInstance(FindPeopleDto, {
      filter: '{"match":"any","conditions":[{"field":"homeGroup","operator":"isEmpty"}]}',
    });

    expect(dto.filter).toEqual({
      match: 'any',
      conditions: [{ field: 'homeGroup', operator: 'isEmpty' }],
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('turns a broken condition filter into a 400', () => {
    expect(() =>
      plainToInstance(FindPeopleDto, {
        filter: '{"conditions":[{"field":"password","operator":"equals","value":"x"}]}',
      }),
    ).toThrow(BadRequestException);
  });
});
