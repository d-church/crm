import { Encrypter } from './encrypter';

describe('Encrypter', () => {
  const encrypter = new Encrypter(Buffer.alloc(32, 1));

  it.each(['Привіт', { userId: 'id', expiresAt: 123 }])('round-trips %j', (value) => {
    const token = encrypter.encrypt(value);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encrypter.encrypt(value)).not.toBe(token);
    expect(encrypter.decrypt(token)).toEqual(value);
  });

  it('rejects tampering and a different key', () => {
    const token = encrypter.encrypt('secret');
    const bytes = Buffer.from(token, 'base64url');
    bytes[12] ^= 1;
    expect(() => encrypter.decrypt(bytes.toString('base64url'))).toThrow();
    expect(() => new Encrypter(Buffer.alloc(32, 2)).decrypt(token)).toThrow();
  });
});
