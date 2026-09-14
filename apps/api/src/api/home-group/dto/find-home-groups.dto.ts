import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { HomeGroupCategory } from '@/infra/prisma/prisma.service';

export class FindHomeGroupsDto {
  @ApiPropertyOptional({ enum: HomeGroupCategory, example: HomeGroupCategory.YOUTH })
  @IsOptional()
  @IsEnum(HomeGroupCategory)
  category?: HomeGroupCategory;
}
