import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PersonStatus } from '@/infra/prisma/prisma.service';

export class CreatePersonDto {
  @ApiProperty({ example: 'Ада', description: 'Given name.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiPropertyOptional({ example: 'Лавлейс', description: 'Family name.' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'ada@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+380671234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    enum: PersonStatus,
    default: PersonStatus.GUEST,
    description: 'Relationship with the church.',
  })
  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

  @ApiPropertyOptional({ example: '1990-12-10', description: 'Date of birth (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-15',
    description: 'When the person joined the church (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ example: 'Прийшла з молодіжної групи.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
