import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ada Lovelace', description: 'Display name.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  name: string;
}
