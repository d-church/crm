import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/infra/prisma/prisma.service';

import { narrow, visibilityFor, type Viewer } from './visibility';

/**
 * Перевірка доступу там, де картка сама не завантажується: події, кроки, сани,
 * хронологія — усі вони ходять по `personId` повз сервіс людей.
 *
 * Невидима людина завжди віддається як «не знайдено», а не «заборонено»: інакше
 * сам факт існування картки ставав би відомим тому, кому вона закрита.
 */
@Injectable()
export class AccessService {
  constructor(private readonly prismaService: PrismaService) {}

  /** Чи користувач взагалі працює з цією людиною. */
  public async assertVisible(personId: string, viewer: Viewer): Promise<void> {
    await this.assertMatches(personId, visibilityFor(viewer).rows);
  }

  /**
   * Чи відкритий пасторський шар — нотатки, спілкування, кроки, хронологія.
   * Участь у команді його не відкриває: потрібна опіка.
   */
  public async assertPastoral(personId: string, viewer: Viewer): Promise<void> {
    await this.assertMatches(personId, visibilityFor(viewer).pastoral);
  }

  private async assertMatches(
    personId: string,
    where: ReturnType<typeof visibilityFor>['rows'],
  ): Promise<void> {
    const person = await this.prismaService.person.findFirst({
      where: narrow({ id: personId }, where),
      select: { id: true },
    });

    if (!person) throw new NotFoundException('Person not found');
  }
}
