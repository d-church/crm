import { createHash } from 'node:crypto';

import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

import { PrismaService } from '@/infra/prisma/prisma.service';

import { AvatarStorage } from './avatar-storage.service';

const QUEUE = 'avatar-cleanup';
const MINUTE = 60_000;

@Injectable()
export class AvatarCleanupService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AvatarCleanupService.name);
  private queue?: Queue<string>;
  private worker?: Worker<string>;
  private producerConnection?: Redis;
  private workerConnection?: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: AvatarStorage,
    private readonly config: ConfigService,
  ) {}

  public async enqueue(key?: string | null, delay = 0): Promise<void> {
    if (!this.storage.owns(key)) return;
    try {
      if (!this.queue || this.producerConnection?.status !== 'ready') {
        throw new Error('Avatar cleanup queue unavailable');
      }
      await this.queue.add('delete', key, {
        jobId: createHash('sha256').update(key).digest('hex'),
        delay,
        attempts: 5,
        backoff: { type: 'exponential', delay: MINUTE },
        removeOnComplete: true,
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 1000 },
      });
    } catch {
      this.logger.warn('Не вдалося поставити видалення аватарки в чергу');
    }
  }

  public onApplicationBootstrap() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url || !this.storage.enabled) return;
    const prefix = this.storage.prefix.includes('/prod/') ? 'crm-prod' : 'crm-dev';
    this.producerConnection = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.workerConnection = new Redis(url, { maxRetriesPerRequest: null });
    for (const connection of [this.producerConnection, this.workerConnection]) {
      connection.on('error', () => this.logger.warn('Redis для очищення аватарок недоступний'));
    }
    this.queue = new Queue(QUEUE, { connection: this.producerConnection, prefix });
    this.worker = new Worker(QUEUE, (job) => this.process(job.data), {
      connection: this.workerConnection,
      prefix,
      // Upstash meters idle Redis commands too.
      drainDelay: 60,
    });
    this.queue.on('error', () => this.logger.warn('Не вдалося підключитися до черги аватарок'));
    this.worker.on('error', () => this.logger.warn('Помилка воркера аватарок'));
    this.worker.on('failed', () =>
      this.logger.warn('Не вдалося очистити аватарку; див. стан завдання в BullMQ'),
    );
  }

  public async process(key: string): Promise<void> {
    if (!this.storage.owns(key)) return;
    const active = await this.prisma.person.findUnique({
      where: { avatarKey: key },
      select: { id: true },
    });
    if (!active) await this.storage.delete(key);
  }

  public async onModuleDestroy() {
    try {
      await this.worker?.close();
      await this.queue?.close();
    } finally {
      this.workerConnection?.disconnect();
      this.producerConnection?.disconnect();
    }
  }
}
