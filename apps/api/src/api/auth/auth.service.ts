import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import type { StringValue } from 'ms';

import { UserService, toSafeUser } from '@/api/user/user.service';

import { LoginDto } from './dto/login.dto';

import { JWTAccessTokenPayload } from './auth.interfaces';

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRATION_TIME: StringValue;
  private readonly JWT_REFRESH_EXPIRATION_TIME: StringValue;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_EXPIRATION_TIME = this.configService.getOrThrow<StringValue>('JWT_EXPIRATION_TIME');
    this.JWT_REFRESH_EXPIRATION_TIME = this.configService.getOrThrow<StringValue>(
      'JWT_REFRESH_EXPIRATION_TIME',
    );
  }

  public async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await verify(user.password, loginDto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { sessionVersion, ...userWithPassword } = user;
    const tokens = await this.generateTokens(user.id, sessionVersion);

    return { user: toSafeUser(userWithPassword), ...tokens };
  }

  public async refresh(refreshToken: string) {
    let payload: JWTAccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<JWTAccessTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const sessionVersion = payload.sessionVersion ?? 0;
    await this.userService.assertSessionVersion(payload.userId, sessionVersion);

    return this.generateTokens(payload.userId, sessionVersion);
  }

  private async generateTokens(userId: string, sessionVersion: number) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { userId, tokenType: 'access', sessionVersion } satisfies JWTAccessTokenPayload,
        {
          expiresIn: this.JWT_EXPIRATION_TIME,
        },
      ),
      this.jwtService.signAsync(
        { userId, tokenType: 'refresh', sessionVersion } satisfies JWTAccessTokenPayload,
        {
          expiresIn: this.JWT_REFRESH_EXPIRATION_TIME,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
