import { createHash, scryptSync } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'argon2';

import { Encrypter } from '@/common/crypto/encrypter';
import { EmailService } from '@/infra/email/email.service';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { ResetPasswordDto } from './dto/password-reset.dto';

const RESET_TTL_MS = 30 * 60_000;
const INVALID_LINK = 'Посилання недійсне або його термін дії минув';

const RESERVE_REQUEST = `
  local count = tonumber(redis.call('GET', KEYS[1]) or '0')
  if count >= 60 then return 0 end
  if not redis.call('SET', KEYS[2], '1', 'EX', 60, 'NX') then return 0 end
  if redis.call('INCR', KEYS[1]) == 1 then redis.call('EXPIRE', KEYS[1], 60) end
  return 1
`;

type ResetClaims = { userId: string; sessionVersion: number; expiresAt: number };

function isResetClaims(value: unknown): value is ResetClaims {
  if (typeof value !== 'object' || value === null) return false;

  const { userId, sessionVersion, expiresAt } = value as Partial<ResetClaims>;
  return (
    typeof userId === 'string' &&
    userId.length > 0 &&
    typeof sessionVersion === 'number' &&
    Number.isSafeInteger(sessionVersion) &&
    sessionVersion >= 0 &&
    typeof expiresAt === 'number' &&
    Number.isSafeInteger(expiresAt)
  );
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly encrypter?: Encrypter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {
    const passphrase = config.get<string>('PASSWORD_RESET_KEY');
    if (passphrase && passphrase.trim()) {
      const salt = `dchurch-crm:password-reset:v1:${config.get<string>('APP_PUBLIC_URL') ?? ''}`;
      this.encrypter = new Encrypter(scryptSync(passphrase, salt, 32));
    }
  }

  public async request(email: string): Promise<void> {
    this.getEncrypter();
    const addressKey = createHash('sha256').update(email.toLowerCase()).digest('hex');
    const allowed = await this.redis.client.eval(
      RESERVE_REQUEST,
      2,
      'password-reset:{requests}:total',
      `password-reset:{requests}:email:${addressKey}`,
    );
    if (allowed === 1) {
      void this.sendLink(email).catch(() => {
        this.logger.error('Password reset email could not be sent');
      });
    }
  }

  public async reset({ token, newPassword, confirmPassword }: ResetPasswordDto): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Паролі не збігаються');
    }

    const encrypter = this.getEncrypter();
    let claims: unknown;
    try {
      claims = encrypter.decrypt(token);
    } catch {
      throw new BadRequestException(INVALID_LINK);
    }
    if (!isResetClaims(claims) || claims.expiresAt <= Date.now()) {
      throw new BadRequestException(INVALID_LINK);
    }

    const where = { id: claims.userId, sessionVersion: claims.sessionVersion };
    const user = await this.prisma.user.findFirst({ where, select: { id: true } });
    if (!user) {
      throw new BadRequestException(INVALID_LINK);
    }

    const password = await hash(newPassword);
    if (claims.expiresAt <= Date.now()) {
      throw new BadRequestException(INVALID_LINK);
    }

    const { count } = await this.prisma.user.updateMany({
      where,
      data: { password, sessionVersion: { increment: 1 } },
    });
    if (count !== 1) {
      throw new BadRequestException(INVALID_LINK);
    }
  }

  private async sendLink(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, sessionVersion: true },
    });
    if (!user) return;

    const origin = new URL(this.config.getOrThrow<string>('APP_PUBLIC_URL'));
    const allowHttp = this.config.get('NODE_ENV') !== 'production' && origin.protocol === 'http:';
    if ((!allowHttp && origin.protocol !== 'https:') || origin.username || origin.password) {
      throw new Error('Invalid APP_PUBLIC_URL');
    }

    const url = new URL('/reset-password', origin);
    const token = this.getEncrypter().encrypt({
      userId: user.id,
      sessionVersion: user.sessionVersion,
      expiresAt: Date.now() + RESET_TTL_MS,
    } satisfies ResetClaims);
    url.hash = `token=${token}`;

    await this.email.send({
      to: user.email,
      subject: 'Відновлення пароля D.Church CRM',
      text: `Щоб встановити новий пароль, перейдіть за посиланням:\n\n${url}\n\nПосилання діє 30 хвилин. Якщо ви не запитували відновлення пароля, проігноруйте цей лист.`,
      disableTracking: true,
    });
  }

  private getEncrypter(): Encrypter {
    if (!this.encrypter) {
      throw new ServiceUnavailableException('Відновлення пароля тимчасово недоступне');
    }

    return this.encrypter;
  }
}
