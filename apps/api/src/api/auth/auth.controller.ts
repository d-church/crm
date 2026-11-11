import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Authorization } from '@/common/decorators/authorization.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RefreshDto } from './dto/refresh.dto';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  public async forgotPassword(@Body() { email }: ForgotPasswordDto) {
    await this.passwordResetService.request(email);
    return { message: 'Якщо акаунт існує, на цю адресу надійде лист' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.passwordResetService.reset(dto);
  }

  @ApiOperation({ summary: 'Login' })
  @Post('login')
  public async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @Post('refresh')
  public async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Authorization()
  @ApiOperation({ summary: 'Get the authenticated user' })
  @Get('me')
  public me(@Req() req: Request) {
    return req.user;
  }
}
