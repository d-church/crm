import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, Role } from '@generated/prisma/client';
import type { Viewer } from '@/api/access/visibility';
import { PrismaService } from '@/infra/prisma/prisma.service';

/** Які частини церкви можна роздивлятися. */
export const STRUCTURE_KINDS = ['community', 'home-group', 'ministry', 'training'] as const;

export type StructureKind = (typeof STRUCTURE_KINDS)[number];

export type StructurePerson = { id: string; firstName: string; lastName: string | null };

const ORDER = [
  { lastName: { sort: 'asc', nulls: 'last' } },
  { firstName: 'asc' },
] satisfies Prisma.PersonOrderByWithRelationInput[];

const SELECT = { id: true, firstName: true, lastName: true } as const;

/**
 * Структура церкви — імена й належність, без переходу в картки. Лідеру треба
 * розуміти, де людина вже задіяна: інакше він не знає ні про навантаження,
 * ні про те, до кого йти. Самі імена чутливими не вважаємо.
 *
 * Видимість тут навмисно ширша за область: це єдине місце, де лідер бачить
 * церкву за межами довіреного йому. Тому й віддаємо рівно імена, нічого більше.
 */
@Injectable()
export class StructureService {
  constructor(private readonly prismaService: PrismaService) {}

  public async peopleOf(
    kind: StructureKind,
    id: string,
    viewer: Viewer,
  ): Promise<StructurePerson[]> {
    this.assertMaySee(viewer);

    switch (kind) {
      case 'community':
        return this.membersOf({ communities: { some: { id } } }, id, 'community');

      case 'home-group':
        return this.membersOf({ homeGroupId: id }, id, 'homeGroup');

      case 'training':
        return this.membersOf({ trainings: { some: { id } } }, id, 'training');

      case 'ministry': {
        await this.assertExists('ministry', id);

        // Лише діючі участі: колишніх у структурі не показуємо.
        const assignments = await this.prismaService.ministryAssignment.findMany({
          where: { ministryId: id, until: null },
          select: { person: { select: SELECT } },
          orderBy: [{ person: { lastName: 'asc' } }, { person: { firstName: 'asc' } }],
        });

        return assignments.map(({ person }) => person);
      }
    }
  }

  /**
   * Конект структури не бачить взагалі: його світ — борда нових людей своєї
   * спільноти. Це найвужчий доступ у системі, і розширювати його тут нема за що.
   */
  private assertMaySee({ roles }: Viewer): void {
    const beyondConnect = roles.filter((role) => role !== Role.CONNECT);

    if (roles.length === 0 || beyondConnect.length === 0) {
      throw new ForbiddenException('Структура церкви доступна лідерам і адміністраторам');
    }
  }

  private async membersOf(
    where: Prisma.PersonWhereInput,
    id: string,
    entity: 'community' | 'homeGroup' | 'training',
  ): Promise<StructurePerson[]> {
    await this.assertExists(entity, id);

    return this.prismaService.person.findMany({ where, select: SELECT, orderBy: ORDER });
  }

  private async assertExists(
    entity: 'community' | 'homeGroup' | 'ministry' | 'training',
    id: string,
  ): Promise<void> {
    const found = await (
      this.prismaService[entity] as { findUnique: (args: unknown) => Promise<unknown> }
    ).findUnique({ where: { id }, select: { id: true } });

    if (!found) throw new NotFoundException('Not found');
  }
}
