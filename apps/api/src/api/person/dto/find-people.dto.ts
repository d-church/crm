import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { DATABASE_UUID_PATTERN } from '@/common/validation/database-uuid';

import { parsePeopleFilter, type PeopleFilter } from '../filter/people-filter';

/**
 * Columns a list can be ordered by — the table's headers, plus `createdAt` for the
 * default view. Anything outside this list is rejected rather than passed to Prisma.
 */
export const PEOPLE_SORTS = [
  'name',
  'gender',
  'membership',
  'activity',
  'homeGroup',
  'lastSeenAt',
  'phone',
  'email',
  'city',
  'address',
  'district',
  'region',
  'age',
  'birthDate',
  'birthday',
  'followUp',
  'connectedBy',
  'responsible',
  'firstVisitAt',
  'baptizedAt',
  'memberSince',
  'leftAt',
  'createdAt',
  'notes',
] as const;

export type PeopleSort = (typeof PEOPLE_SORTS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
/** Keeps one request from pulling the whole table; the CSV export pages instead. */
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_SORT: PeopleSort = 'createdAt';
/** Newest first, which is what the default `createdAt` view means. */
export const DEFAULT_SORT_ORDER: SortOrder = 'desc';

const parseBoolean = ({ value }: TransformFnParams): unknown => {
  const raw: unknown = value;

  if (raw === true || raw === 'true') return true;
  if (raw === false || raw === 'false') return false;

  return raw;
};

export class FindPeopleDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Include people whose activity is INACTIVE.',
  })
  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  includeInactive?: boolean;

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

  @ApiPropertyOptional({ description: 'Minimum age in completed years', minimum: 0, maximum: 130 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Maximum age in completed years', minimum: 0, maximum: 130 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(130)
  maxAge?: number;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'communityId must be a UUID' })
  communityId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'homeGroupId must be a UUID' })
  homeGroupId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'trainingId must be a UUID' })
  trainingId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000001' })
  @IsOptional()
  @Matches(DATABASE_UUID_PATTERN, { message: 'ministryId must be a UUID' })
  ministryId?: string;

  @ApiPropertyOptional({
    type: String,
    description:
      'Condition filter as JSON. `match` is `all` or `any`; each condition names a `field`, an `operator` and, unless it asks about emptiness, a `value`. Combined with the other filters by AND.',
    example:
      '{"match":"all","conditions":[{"field":"membership","operator":"in","value":["GUEST"]},{"field":"lastSeenAt","operator":"moreThanDaysAgo","value":60}]}',
  })
  @IsOptional()
  // Parsing throws a 400 that names the broken condition, so the checks live there.
  @Transform(({ value }) => (value === undefined ? undefined : parsePeopleFilter(value)))
  @IsObject()
  filter?: PeopleFilter;

  @ApiPropertyOptional({ enum: PEOPLE_SORTS, default: DEFAULT_SORT })
  @IsOptional()
  @IsIn(PEOPLE_SORTS)
  sort?: PeopleSort;

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: DEFAULT_SORT_ORDER,
    description: 'Text sorts alphabetically, numbers and dates from smallest to largest.',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}
