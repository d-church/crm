import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

export class FindMinistriesDto {
  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'communityId must be a UUID' })
  communityId?: string;
}
