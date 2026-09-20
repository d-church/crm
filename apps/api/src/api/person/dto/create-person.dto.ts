import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

import { FollowUpState, PersonGender, PersonStatus } from '@/infra/prisma/prisma.service';
import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

export class CreatePersonDto {
  @ApiProperty({ example: 'Ігор', description: 'Given name.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ example: 'Бачинський', description: 'Family name.' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ enum: PersonGender, description: 'Стать людини.' })
  @IsOptional()
  @IsEnum(PersonGender)
  gender?: PersonGender;

  @ApiPropertyOptional({ example: 'ihor@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+380671234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: '272-27-98', description: 'Домашній телефон.' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  homePhone?: string;

  @ApiPropertyOptional({ example: '032 123 45 67', description: 'Робочий телефон.' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  workPhone?: string;

  @ApiPropertyOptional({ example: 'Львів' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'вул. Б. Хмельницького 23/5а' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ example: '79019' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Пустомитівський' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @ApiPropertyOptional({ example: 'Львівська' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  region?: string;

  @ApiPropertyOptional({
    enum: PersonStatus,
    default: PersonStatus.NEW,
    description: 'Where the person is on the church pipeline.',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

  @ApiPropertyOptional({ example: '2026-08-09', description: 'Перший візит (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  firstVisitAt?: string;

  @ApiPropertyOptional({ example: '2026-08-17', description: 'Остання зустріч (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  lastSeenAt?: string;

  @ApiPropertyOptional({ example: 'Марія', description: 'Connect — хто вийшов на контакт.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  connectedBy?: string;

  @ApiPropertyOptional({
    enum: FollowUpState,
    default: FollowUpState.NOT_DONE,
    description: 'Follow-up — чи вже передзвонили.',
  })
  @IsOptional()
  @IsEnum(FollowUpState)
  followUp?: FollowUpState;

  @ApiPropertyOptional({ example: 'зустріч для нових', description: 'Next Step.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nextStep?: string;

  @ApiPropertyOptional({
    example: ['00000000-0000-4000-8000-000000000001'],
    description: 'Повний набір спільнот людини.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Matches(DATABASE_UUID_PATTERN, {
    each: true,
    message: 'each value in communityIds must be a UUID',
  })
  communityIds?: string[];

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Домашня група людини.',
  })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'homeGroupId must be a UUID' })
  homeGroupId?: string;

  @ApiPropertyOptional({
    example: ['00000000-0000-4000-8000-000000000001'],
    description: 'Повний набір служінь людини.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Matches(DATABASE_UUID_PATTERN, {
    each: true,
    message: 'each value in ministryIds must be a UUID',
  })
  ministryIds?: string[];

  @ApiPropertyOptional({
    example: ['00000000-0000-4000-8000-000000000001'],
    description: 'Повний набір пройдених навчань людини.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Matches(DATABASE_UUID_PATTERN, {
    each: true,
    message: 'each value in trainingIds must be a UUID',
  })
  trainingIds?: string[];

  @ApiPropertyOptional({ example: 'Петро', description: 'Відповідальний за людину.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  responsible?: string;

  @ApiPropertyOptional({ example: 'запросити на зустріч', description: 'Наступна дія.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nextAction?: string;

  @ApiPropertyOptional({ example: '2026-08-17', description: 'Коли зробити наступну дію.' })
  @IsOptional()
  @IsDateString()
  nextActionAt?: string;

  @ApiPropertyOptional({ example: '1990-12-10', description: 'Date of birth (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: '1998-07-27', description: 'Водне хрещення (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  baptizedAt?: string;

  @ApiPropertyOptional({ example: '2005-01-24', description: 'Став членом церкви (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  memberSince?: string;

  @ApiPropertyOptional({ example: '2024-03-01', description: 'Вибув з членства (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  leftAt?: string;

  @ApiPropertyOptional({ example: 'Прийшов з молодіжної групи.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
