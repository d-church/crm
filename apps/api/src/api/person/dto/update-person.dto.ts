import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, Matches } from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

import { CreatePersonDto } from './create-person.dto';

/**
 * Спільноту виносимо з успадкування й описуємо заново: на створенні вона
 * обовʼязкова, а на редагуванні — ні. У базі є люди без жодної спільноти
 * (колишні члени), і їхню картку має бути можливо зберегти, не вигадуючи їм гілку.
 */
export class UpdatePersonDto extends PartialType(
  OmitType(CreatePersonDto, ['communityIds'] as const),
) {
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
}
