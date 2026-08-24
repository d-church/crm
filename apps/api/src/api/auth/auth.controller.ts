import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Authorization } from '@/common/decorators/authorization.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  public async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
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
