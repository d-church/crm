import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { narrow, visibilityFor, type Viewer } from '@/api/access/visibility';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { AvatarCleanupService } from './avatar-cleanup.service';
import { AVATAR_UPLOAD_LIMIT, encodeAvatar } from './avatar-image';
import { AvatarStorage } from './avatar-storage.service';

@Injectable()
export class PersonAvatarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: AvatarStorage,
    private readonly cleanup: AvatarCleanupService,
  ) {}

  // Like names, photos are writable for any visible person.
  private visible(id: string, viewer: Viewer) {
    return narrow({ id }, visibilityFor(viewer).rows);
  }

  private async current(id: string, viewer: Viewer) {
    const person = await this.prisma.person.findFirst({
      where: this.visible(id, viewer),
      select: { avatarKey: true },
    });
    if (!person) throw new NotFoundException('Person not found');
    return person.avatarKey;
  }

  public async replace(id: string, viewer: Viewer, input?: Buffer) {
    const previous = await this.current(id, viewer);
    if (!this.storage.enabled) throw new ServiceUnavailableException('Сховище фото недоступне');
    if (!input?.length || input.length > AVATAR_UPLOAD_LIMIT) {
      throw new BadRequestException('Додайте фото розміром до 2 МБ');
    }
    const data = await encodeAvatar(input);
    const key = this.storage.newKey(id);
    const avatarUrl = await this.storage.url(key);
    try {
      await this.storage.put(key, data);
    } catch {
      // A timed-out PUT can still finish on the storage side.
      await this.cleanup.enqueue(key, 15 * 60_000);
      throw new ServiceUnavailableException('Не вдалося завантажити фото. Спробуйте ще раз');
    }
    try {
      await this.updateKey(id, viewer, previous, key);
    } catch (error) {
      await this.cleanup.enqueue(key);
      throw error;
    }
    await this.cleanup.enqueue(previous);

    return { avatarUrl };
  }

  public async remove(id: string, viewer: Viewer) {
    const previous = await this.current(id, viewer);
    if (!previous) return;
    await this.updateKey(id, viewer, previous, null);
    await this.cleanup.enqueue(previous);
  }

  private async updateKey(
    id: string,
    viewer: Viewer,
    previous: string | null,
    avatarKey: string | null,
  ) {
    const { count } = await this.prisma.person.updateMany({
      where: { AND: [this.visible(id, viewer), { avatarKey: previous }] },
      data: { avatarKey },
    });
    if (!count) throw new ConflictException('Фото вже змінилося. Оновіть картку');
  }
}
