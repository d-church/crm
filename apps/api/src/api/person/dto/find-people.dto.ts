import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { PersonStatus } from '@/infra/prisma/prisma.service';

export const PEOPLE_SORTS = ['createdAt', 'lastSeenAt', 'name', 'status'] as const;

export type PeopleSort = (typeof PEOPLE_SORTS)[number];

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
/** Keeps one request from pulling the whole table; the CSV export pages instead. */
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_SORT: PeopleSort = 'createdAt';

export class FindPeopleDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Матчить імʼя, прізвище, телефони, email і місто. Кожне слово має знайтися.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: PersonStatus })
  @IsOptional()
  @IsIn(Object.values(PersonStatus))
  status?: PersonStatus;

  @ApiPropertyOptional({ example: 'Молодь — пʼятниця' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  community?: string;

  @ApiPropertyOptional({ example: 'Прославлення' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ministry?: string;

  @ApiPropertyOptional({ enum: PEOPLE_SORTS, default: DEFAULT_SORT })
  @IsOptional()
  @IsIn(PEOPLE_SORTS)
  sort?: PeopleSort;
}
