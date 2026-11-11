import { PickType } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { ChangePasswordDto } from '@/api/user/dto/change-password.dto';

import { LoginDto } from './login.dto';

export class ForgotPasswordDto extends PickType(LoginDto, ['email'] as const) {}

export class ResetPasswordDto extends PickType(ChangePasswordDto, [
  'newPassword',
  'confirmPassword',
] as const) {
  @Matches(/^[A-Za-z0-9_-]{1,512}$/)
  token: string;
}
