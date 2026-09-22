import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateStepTypeDto {
  @ApiProperty({ example: 'Курс для подружжя' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}

export class UpdateStepTypeDto {
  @ApiPropertyOptional({ example: 'Курс для подружжя' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Архівний крок не пропонується для нових людей.' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderStepTypesDto {
  @ApiProperty({
    type: [String],
    description: 'Ідентифікатори кроків у потрібному порядку.',
  })
  @IsArray()
  @ArrayUnique()
  @Matches(DATABASE_UUID_PATTERN, { each: true, message: 'each value in ids must be a UUID' })
  ids: string[];
}
