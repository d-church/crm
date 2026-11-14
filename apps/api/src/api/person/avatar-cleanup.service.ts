import { createHash } from 'node:crypto';

import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

import type { Prisma } from '@generated/prisma/client';
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
  private timer?: ReturnType<typeof setInterval>;
  private dispatch?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: AvatarStorage,
    private readonly config: ConfigService,
  ) {}

  public async record(tx: Prisma.TransactionClient, key?: string | null) {
    if (!this.storage.owns(key)) return;
    await tx.avatarCleanup.upsert({
      where: { key },
      create: { key, notBefore: new Date() },
      update: {},
    });
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
      this.logger.warn('Не вдалося очистити аватарку; завдання збережено'),
    );
    this.timer = setInterval(() => this.schedule(), MINUTE);
    this.timer.unref();
    this.producerConnection.once('ready', () => this.schedule());
  }

  private schedule() {
    if (this.dispatch) return;
    this.dispatch = this.enqueueDue()
      .catch(() => {
        this.logger.warn('Не вдалося передати очищення аватарок у BullMQ');
      })
      .finally(() => {
        this.dispatch = undefined;
      });
  }

  private async enqueueDue() {
    if (!this.queue || this.producerConnection?.status !== 'ready') return;
    let after: string | undefined;
    const now = new Date();
    for (;;) {
      const tasks = await this.prisma.avatarCleanup.findMany({
        where: {
          key: { startsWith: this.storage.prefix, gt: after },
          notBefore: { lte: now },
        },
        select: { key: true },
        orderBy: { key: 'asc' },
        take: 100,
      });
      if (!tasks.length) return;
      await this.queue.addBulk(
        tasks.map(({ key }) => ({
          name: 'delete',
          data: key,
          opts: {
            jobId: createHash('sha256').update(key).digest('hex'),
            attempts: 5,
            backoff: { type: 'exponential', delay: MINUTE },
            removeOnComplete: true,
            removeOnFail: true,
          },
        })),
      );
      after = tasks.at(-1)?.key;
    }
  }

  public async process(key: string): Promise<void> {
    if (!this.storage.owns(key)) return;
    const { count } = await this.prisma.avatarCleanup.updateMany({
      where: { key, notBefore: { lte: new Date() } },
      data: { claimed: true },
    });
    if (count === 0) return;

    const active = await this.prisma.person.findUnique({
      where: { avatarKey: key },
      select: { id: true },
    });
    if (!active) await this.storage.delete(key);
    await this.prisma.avatarCleanup.deleteMany({ where: { key } });
  }

  public async onModuleDestroy() {
    clearInterval(this.timer);
    try {
      await this.dispatch;
      await this.worker?.close();
      await this.queue?.close();
    } finally {
      this.workerConnection?.disconnect();
      this.producerConnection?.disconnect();
    }
  }
}
