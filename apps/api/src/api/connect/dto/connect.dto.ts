import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { PersonGender } from '@/infra/prisma/prisma.service';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Обовʼязкові імʼя, стать і захід. Дата й служитель підтягуються самі. */
export class QuickAddDto {
  @ApiProperty({ example: 'Марія' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ example: 'Коваль' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ enum: PersonGender, description: 'Стать людини.' })
  @IsEnum(PersonGender, { message: 'Оберіть стать' })
  gender: PersonGender;

  @ApiProperty({ description: 'Захід, на якому познайомились.' })
  @Matches(DATABASE_UUID_PATTERN, { message: 'eventTypeId must be a UUID' })
  eventTypeId: string;

  @ApiPropertyOptional({ example: '+380670000000' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class HandoverDto {
  @ApiProperty({ description: 'Кому передаємо ведення: фолов-ап і опіку разом.' })
  @Matches(DATABASE_UUID_PATTERN, { message: 'caregiverId must be a UUID' })
  caregiverId: string;
}
