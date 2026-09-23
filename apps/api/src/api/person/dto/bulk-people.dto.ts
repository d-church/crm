import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { ActivityState, MembershipStatus, MinistryRole } from '@/infra/prisma/prisma.service';

/** Що саме робимо з відміченими людьми. */
export const BULK_ACTIONS = [
  'ministry',
  'community',
  'training',
  'homeGroup',
  'step',
  'churchRole',
  'membership',
  'activity',
  'careNeeded',
] as const;

export type BulkAction = (typeof BULK_ACTIONS)[number];

export const BULK_MODES = ['add', 'remove'] as const;

export type BulkMode = (typeof BULK_MODES)[number];

/** Стільки людей у церкві такого розміру все одно не буває в одному списку. */
export const MAX_BULK_PEOPLE = 2000;

export class BulkPeopleDto {
  @ApiProperty({ type: [String], description: 'Кого змінюємо.' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(MAX_BULK_PEOPLE)
  @Matches(DATABASE_UUID_PATTERN, { each: true, message: 'each value in personIds must be a UUID' })
  personIds: string[];

  @ApiProperty({ enum: BULK_ACTIONS })
  @IsIn(BULK_ACTIONS)
  action: BulkAction;

  @ApiPropertyOptional({
    enum: BULK_MODES,
    default: 'add',
    description: 'Додати до набору чи прибрати з нього.',
  })
  @IsOptional()
  @IsIn(BULK_MODES)
  mode?: BulkMode;

  @ApiPropertyOptional({ description: 'Служіння, спільнота, навчання, крок — залежно від дії.' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'targetId must be a UUID' })
  targetId?: string | null;

  @ApiPropertyOptional({ enum: MinistryRole, default: MinistryRole.MEMBER })
  @IsOptional()
  @IsEnum(MinistryRole)
  role?: MinistryRole;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  membership?: MembershipStatus;

  @ApiPropertyOptional({ enum: ActivityState })
  @IsOptional()
  @IsEnum(ActivityState)
  activity?: ActivityState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  careNeeded?: boolean;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Дедлайн для масово призначеного кроку.',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ example: 'Петро' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  responsible?: string;
}
