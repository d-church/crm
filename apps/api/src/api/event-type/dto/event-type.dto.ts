import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEventTypeDto {
  @ApiProperty({ example: 'Альфа-курс' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}

export class UpdateEventTypeDto {
  @ApiPropertyOptional({ example: 'Альфа-курс' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class ReorderEventTypesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @Matches(DATABASE_UUID_PATTERN, { each: true, message: 'each value in ids must be a UUID' })
  ids: string[];
}
