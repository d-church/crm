import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
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

export class CreateChurchRoleDto {
  @ApiProperty({ example: '00000000-0000-4000-8000-000000000001', description: 'Сан з довідника.' })
  @Matches(DATABASE_UUID_PATTERN, { message: 'roleTypeId must be a UUID' })
  roleTypeId: string;

  @ApiPropertyOptional({ example: '2020-05-10', description: 'З якої дати служить у сані.' })
  @IsOptional()
  @IsDateString()
  since?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Коли склав сан.' })
  @IsOptional()
  @IsDateString()
  until?: string | null;
}

export class UpdateChurchRoleDto {
  @ApiPropertyOptional({ example: '2020-05-10' })
  @IsOptional()
  @IsDateString()
  since?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  until?: string | null;
}

export class CreateChurchRoleTypeDto {
  @ApiProperty({ example: 'Єпископ' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}

export class UpdateChurchRoleTypeDto {
  @ApiPropertyOptional({ example: 'Старший пресвітер' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Архівний сан не пропонується для нових призначень.' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderChurchRoleTypesDto {
  @ApiProperty({ type: [String], description: 'Ідентифікатори санів у потрібному порядку.' })
  @IsArray()
  @ArrayUnique()
  @Matches(DATABASE_UUID_PATTERN, { each: true, message: 'each value in ids must be a UUID' })
  ids: string[];
}
