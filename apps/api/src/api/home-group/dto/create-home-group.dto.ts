import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { HomeGroupCategory } from '@/infra/prisma/prisma.service';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateHomeGroupDto {
  @ApiProperty({ example: 'Винники, четвер' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ enum: HomeGroupCategory, example: HomeGroupCategory.YOUTH })
  @IsEnum(HomeGroupCategory)
  category: HomeGroupCategory;

  @ApiPropertyOptional({ example: 'вул. Шевченка, 12, Винники' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'leaderId must be a UUID' })
  leaderId?: string;
}
