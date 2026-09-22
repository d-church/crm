import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { StepState } from '@/infra/prisma/prisma.service';

export class CreateStepDto {
  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Крок з довідника.',
  })
  @Matches(DATABASE_UUID_PATTERN, { message: 'stepTypeId must be a UUID' })
  stepTypeId: string;

  @ApiPropertyOptional({ enum: StepState, default: StepState.PLANNED })
  @IsOptional()
  @IsEnum(StepState)
  state?: StepState;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Коли крок варто зробити.' })
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({ example: '2026-09-20', description: 'Коли крок фактично завершили.' })
  @IsOptional()
  @IsDateString()
  completedAt?: string | null;

  @ApiPropertyOptional({ example: 'Петро', description: 'Хто з команди веде цей крок.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  responsible?: string | null;

  @ApiPropertyOptional({ example: 'Домовились на після служіння' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
