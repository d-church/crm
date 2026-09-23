import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { PersonEventKind } from '@/infra/prisma/prisma.service';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePersonEventDto {
  @ApiPropertyOptional({
    enum: PersonEventKind,
    default: PersonEventKind.EVENT,
    description: 'Подія життя або вид спілкування.',
  })
  @IsOptional()
  @IsEnum(PersonEventKind)
  kind?: PersonEventKind;

  @ApiPropertyOptional({ example: 'Одруження', description: 'Обовʼязкова для події життя.' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string | null;

  @ApiProperty({ example: '2024-08-17' })
  @IsDateString()
  occurredAt: string;

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Хто з представників церкви спілкувався.',
  })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'withPersonId must be a UUID' })
  withPersonId?: string | null;

  @ApiPropertyOptional({ example: 'Домовились зустрітись після служіння' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}

export class UpdatePersonEventDto {
  @ApiPropertyOptional({ enum: PersonEventKind })
  @IsOptional()
  @IsEnum(PersonEventKind)
  kind?: PersonEventKind;

  @ApiPropertyOptional({ example: 'Одруження' })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string | null;

  @ApiPropertyOptional({ example: '2024-08-17' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'withPersonId must be a UUID' })
  withPersonId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}
