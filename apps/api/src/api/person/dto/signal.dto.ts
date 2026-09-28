import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SignalDto {
  @ApiProperty({
    example: 'Пропустив три репетиції поспіль, на дзвінки не відповідає',
    description: 'Що саме лідер хоче передати попечителю.',
  })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  note: string;
}
