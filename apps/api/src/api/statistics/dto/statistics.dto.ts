import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StatisticsQueryDto {
  @ApiPropertyOptional({
    description: '«all», «rest» або ідентифікатор спільноти-відгалуження.',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  segment?: string;
}
