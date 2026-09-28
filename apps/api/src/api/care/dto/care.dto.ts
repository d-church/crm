import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

export class CreateCareDto {
  @ApiProperty({ description: 'Хто бере людину під опіку.' })
  @Matches(DATABASE_UUID_PATTERN, { message: 'caregiverId must be a UUID' })
  caregiverId: string;
}
