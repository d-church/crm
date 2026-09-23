import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, Matches } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

/** Прибирати шум доводиться пачками: один випадковий клік часто повторюється. */
export class DeleteActivitiesDto {
  @ApiProperty({ type: [String], description: 'Записи журналу, які треба прибрати.' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @Matches(DATABASE_UUID_PATTERN, { each: true, message: 'each value in ids must be a UUID' })
  ids: string[];
}
