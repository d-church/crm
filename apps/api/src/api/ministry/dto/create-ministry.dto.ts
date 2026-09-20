import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMinistryDto {
  @ApiProperty({ example: 'Прославлення' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001', nullable: true })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'communityId must be a UUID' })
  communityId?: string | null;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000002' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'leaderId must be a UUID' })
  leaderId?: string;
}
