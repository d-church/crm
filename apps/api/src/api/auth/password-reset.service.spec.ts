import { scryptSync } from 'node:crypto';
import { join } from 'node:path';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';

import { Encrypter } from '@/common/crypto/encrypter';
import type { EmailService } from '@/infra/email/email.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { RedisService } from '@/infra/redis/redis.service';

import type { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';

const passphrase = 'test reset phrase';
const publicUrl = 'https://crm.example.com';
const key = scryptSync(passphrase, `dchurch-crm:password-reset:v1:${publicUrl}`, 32);
const email = 'member@example.com';
const id = 'user-id';

describe('PasswordResetService', () => {
  const reserve = jest.fn();
  const findUnique = jest.fn();
  const findFirst = jest.fn();
  const updateMany = jest.fn();
  const send = jest.fn<Promise<void>, [Parameters<EmailService['send']>[0]]>();
  const service = new PasswordResetService(
    { user: { findUnique, findFirst, updateMany } } as unknown as PrismaService,
    { client: { eval: reserve } } as unknown as RedisService,
    { send } as unknown as EmailService,
    new ConfigService({
      PASSWORD_RESET_KEY: passphrase,
      APP_PUBLIC_URL: publicUrl,
    }),
  );
  const controller = new AuthController({} as AuthService, service);

  const tokenFor = (expiresAt: number) =>
    new Encrypter(key).encrypt({ userId: id, sessionVersion: 0, expiresAt });

  const reset = (token: string) =>
    service.reset({ token, newPassword: 'next-password', confirmPassword: 'next-password' });

  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('returns the same response while mailing only a known account', async () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      CLIENT_DIST_PATH: join(__dirname, '__missing_client_build__'),
    });
    reserve.mockResolvedValue(1);
    findUnique.mockResolvedValueOnce({ id, email, sessionVersion: 0 }).mockResolvedValueOnce(null);
    const sent = new Promise<void>((resolve, reject) => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation((message: unknown) => {
        reject(new Error(String(message)));
      });
      send.mockImplementation(() => {
        resolve();
        return Promise.resolve();
      });
    });

    const [known, unknown] = await Promise.all([
      controller.forgotPassword({ email }),
      controller.forgotPassword({ email: 'unknown@example.com' }),
      sent,
    ]);
    expect(unknown).toEqual(known);
    expect(send).toHaveBeenCalledTimes(1);
    const [message] = send.mock.calls[0];
    expect(message.to).toBe(email);
    expect(message.disableTracking).toBe(true);
    const token = /https:\/\/crm\.example\.com\/reset-password#token=([\w-]+)/.exec(
      message.text,
    )?.[1];
    expect(token).toBeDefined();
    expect(message.html).toContain(`href="https://crm.example.com/reset-password#token=${token}"`);
    expect(message.html).toContain('cid:apple-touch-icon.png');
    expect(message.inline?.name).toBe('apple-touch-icon.png');
    expect(new Encrypter(key).decrypt(token ?? '')).toMatchObject({
      userId: id,
      sessionVersion: 0,
    });
  });

  it('skips lookup if the Redis limit denies the request', async () => {
    reserve.mockResolvedValue(0);
    await controller.forgotPassword({ email });
    expect(findUnique).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects expired links before touching the database', async () => {
    await expect(reset(tokenFor(Date.now() - 1))).rejects.toThrow('Посилання недійсне');
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('applies only one concurrent reset and invalidates other links of the same version', async () => {
    const state = { sessionVersion: 0, password: '' };
    type Update = {
      where: { id: string; sessionVersion: number };
      data: { password: string; sessionVersion: { increment: number } };
    };
    findFirst.mockImplementation(({ where }: Pick<Update, 'where'>) =>
      Promise.resolve(where.sessionVersion === state.sessionVersion ? { id } : null),
    );
    updateMany.mockImplementation(({ where, data }: Update) => {
      expect(where.id).toBe(id);
      if (where.sessionVersion !== state.sessionVersion) return Promise.resolve({ count: 0 });
      state.sessionVersion += data.sessionVersion.increment;
      state.password = data.password;
      return Promise.resolve({ count: 1 });
    });
    const expiresAt = Date.now() + 60_000;
    const token = tokenFor(expiresAt);
    const results = await Promise.allSettled([reset(token), reset(token)]);
    expect(results.map(({ status }) => status).sort()).toEqual(['fulfilled', 'rejected']);
    await expect(reset(tokenFor(expiresAt))).rejects.toThrow('Посилання недійсне');
    await expect(verify(state.password, 'next-password')).resolves.toBe(true);
  });
});
