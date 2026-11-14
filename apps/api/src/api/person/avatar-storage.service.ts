import { randomUUID } from 'node:crypto';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnApplicationShutdown, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AvatarStorage implements OnApplicationShutdown {
  public readonly prefix: string;
  private readonly bucket: string;
  private readonly client?: S3Client;

  constructor(config: ConfigService) {
    const production = config.get('NODE_ENV') === 'production';
    this.prefix =
      config.get<string>('R2_AVATAR_PREFIX') ?? (production ? 'avatars/prod/' : 'avatars/dev/');
    this.bucket = config.get<string>('R2_BUCKET') ?? '';
    const endpoint = config.get<string>('R2_ENDPOINT');
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY');
    if (
      this.prefix === (production ? 'avatars/prod/' : 'avatars/dev/') &&
      this.bucket &&
      endpoint &&
      accessKeyId &&
      secretAccessKey
    ) {
      this.client = new S3Client({
        endpoint,
        region: 'auto',
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  public get enabled() {
    return Boolean(this.client);
  }

  public owns(key: string | null | undefined): key is string {
    return Boolean(key?.startsWith(this.prefix));
  }

  public newKey(personId: string) {
    return `${this.prefix}${personId}/${randomUUID()}.webp`;
  }

  public async url(key: string | null | undefined): Promise<string | null> {
    if (!this.client || !this.owns(key)) return null;
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 900,
    });
  }

  public async put(key: string, data: Buffer): Promise<void> {
    const client = this.requireClient(key);
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: 'image/webp',
        CacheControl: 'private, max-age=300',
      }),
      { abortSignal: AbortSignal.timeout(15_000) },
    );
  }

  public async delete(key: string): Promise<void> {
    await this.requireClient(key).send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(15_000),
    });
  }

  private requireClient(key: string): S3Client {
    if (!this.client || !this.owns(key)) {
      throw new ServiceUnavailableException('Сховище фото недоступне');
    }
    return this.client;
  }

  public onApplicationShutdown() {
    this.client?.destroy();
  }
}
