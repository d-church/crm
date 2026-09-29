import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { AttendanceStatus } from '@/infra/prisma/prisma.service';
import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

const uuid = (field: string) => ({ message: `${field} must be a UUID` });

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Як часто повторювати. Повного движка повторень тут немає — лише генерація наперед. */
export const REPEAT_MODES = ['weekly', 'biweekly', 'monthly'] as const;

export type RepeatMode = (typeof REPEAT_MODES)[number];

/** Скільки зібрань за раз дозволяємо згенерувати: рік щотижневих з запасом. */
export const MAX_OCCURRENCES = 60;

export class CreateGatheringDto {
  @ApiProperty()
  @Matches(DATABASE_UUID_PATTERN, uuid('typeId'))
  typeId: string;

  @ApiPropertyOptional({ description: 'Порожня назва означає «як вид зібрання».' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  title?: string | null;

  @ApiProperty({ example: '2026-10-05T18:30:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  note?: string | null;

  @ApiPropertyOptional({ description: 'Скільки було гостей без картки.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  guestCount?: number;

  @ApiPropertyOptional({ description: 'Без жодної області зібрання загальноцерковне.' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid('communityId'))
  communityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid('homeGroupId'))
  homeGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid('ministryId'))
  ministryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid('trainingId'))
  trainingId?: string;

  @ApiPropertyOptional({
    enum: REPEAT_MODES,
    description: 'Створити серію наперед. Кожне зібрання далі живе окремо.',
  })
  @IsOptional()
  @IsIn(REPEAT_MODES)
  repeat?: RepeatMode;

  @ApiPropertyOptional({ description: 'Скільки зібрань створити разом із першим.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_OCCURRENCES)
  occurrences?: number;
}

export class UpdateGatheringDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid('typeId'))
  typeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  note?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  guestCount?: number;
}

export class FindGatheringsDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

class AttendanceMarkDto {
  @ApiProperty()
  @Matches(DATABASE_UUID_PATTERN, uuid('personId'))
  personId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [AttendanceMarkDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttendanceMarkDto)
  marks: AttendanceMarkDto[];
}
