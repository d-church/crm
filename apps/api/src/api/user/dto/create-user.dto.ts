import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace', description: 'Display name.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @ApiProperty({ example: 'ada@example.com', description: 'Unique email.' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'correct-horse-battery-staple',
    description: 'Plain password (hash before persist).',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
