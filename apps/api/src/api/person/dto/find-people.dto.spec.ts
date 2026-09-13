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
});
