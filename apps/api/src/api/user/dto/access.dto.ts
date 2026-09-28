import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsOptional, Matches } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';
import { Role, ScopeLevel } from '@/infra/prisma/prisma.service';

const uuid = { message: 'must be a UUID' };

export class UpdateUserRolesDto {
  @ApiProperty({
    enum: Role,
    isArray: true,
    description: 'Повний набір ролей. Порожній список знімає доступ до системи.',
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles: Role[];
}

export class LinkUserPersonDto {
  @ApiPropertyOptional({
    description: 'Ким користувач є в базі людей. null розриває звʼязок.',
    nullable: true,
  })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid)
  personId?: string | null;
}

/**
 * Область вказує рівно на одну сутність — це стереже CHECK у базі, а тут ми
 * перевіряємо те саме раніше, щоб користувач отримав зрозумілу помилку.
 */
export class CreateUserScopeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid)
  communityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid)
  homeGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid)
  ministryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, uuid)
  trainingId?: string;

  @ApiPropertyOptional({ enum: ScopeLevel, default: ScopeLevel.VIEW })
  @IsOptional()
  @IsEnum(ScopeLevel)
  level?: ScopeLevel;
}
