import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export class Encrypter {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) {
      throw new Error('AES-256-GCM requires a 32-byte key');
    }
  }

  public encrypt(data: string | object): string {
    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce, { authTagLength: TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);

    return Buffer.concat([nonce, cipher.getAuthTag(), ciphertext]).toString('base64url');
  }

  public decrypt(token: string): unknown {
    const data = Buffer.from(token, 'base64url');
    const ciphertextOffset = NONCE_BYTES + TAG_BYTES;
    if (data.length <= ciphertextOffset || data.toString('base64url') !== token) {
      throw new Error('Invalid encrypted data');
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key, data.subarray(0, NONCE_BYTES), {
      authTagLength: TAG_BYTES,
    });
    decipher.setAuthTag(data.subarray(NONCE_BYTES, ciphertextOffset));

    const plaintext = Buffer.concat([
      decipher.update(data.subarray(ciphertextOffset)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as unknown;
  }
}
