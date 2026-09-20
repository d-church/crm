import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateMinistryDto } from './create-ministry.dto';
import { FindMinistriesDto } from './find-ministries.dto';
import { UpdateMinistryDto } from './update-ministry.dto';

describe('Ministry DTOs', () => {
  it('accepts creation without a community and rejects an invalid community ID', async () => {
    await expect(
      validate(plainToInstance(CreateMinistryDto, { name: 'Welcome' })),
    ).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(CreateMinistryDto, { name: 'Welcome', communityId: null })),
    ).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(CreateMinistryDto, { name: 'Welcome', communityId: 'other' })),
    ).resolves.toHaveLength(1);
  });

  it('accepts null to clear a community on update', async () => {
    await expect(
      validate(plainToInstance(UpdateMinistryDto, { communityId: null })),
    ).resolves.toHaveLength(0);
  });

  it('accepts the unassigned filter and rejects other values', async () => {
    await expect(
      validate(plainToInstance(FindMinistriesDto, { withoutCommunity: 'true' })),
    ).resolves.toHaveLength(0);
    await expect(
      validate(plainToInstance(FindMinistriesDto, { withoutCommunity: 'false' })),
    ).resolves.toHaveLength(1);
  });
});
