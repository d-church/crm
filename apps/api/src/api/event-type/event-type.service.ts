import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateEventTypeDto, ReorderEventTypesDto, UpdateEventTypeDto } from './dto/event-type.dto';

const INCLUDE = { _count: { select: { events: true } } } as const satisfies Prisma.EventTypeInclude;

/**
 * Довідник заходів, на яких знайомляться з новими людьми. Вільний текст тут не
 * годиться: «Альфа», «альфа-курс» і «Alpha» стали б трьома різними подіями.
 */
@Injectable()
export class EventTypeService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(includeArchived = false): Promise<EventType[]> {
    const types = await this.prismaService.eventType.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: INCLUDE,
    });

    return types.map(toEventType);
  }

  public async create({ name }: CreateEventTypeDto): Promise<EventType> {
    const last = await this.prismaService.eventType.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const type = await this.prismaService.eventType.create({
      // Новий захід стає в кінець списку, а не перед тими, що вже усталились.
      data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 },
      include: INCLUDE,
    });

    return toEventType(type);
  }

  public async update(id: string, dto: UpdateEventTypeDto): Promise<EventType> {
    await this.findOne(id);

    const type = await this.prismaService.eventType.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });

    return toEventType(type);
  }

  /** Порядок задається одним списком, тож він не може розʼїхатись між запитами. */
  public async reorder({ ids }: ReorderEventTypesDto): Promise<EventType[]> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.eventType.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );

    return this.findAll(true);
  }

  /**
   * Захід, на який уже посилаються події, видалити не можна — це стерло б історію
   * знайомств. Такий захід архівують: він зникає з вибору, але лишається в картках.
   */
  public async remove(id: string): Promise<EventType> {
    const type = await this.findOne(id);

    if (type.usageCount > 0) {
      throw new ConflictException(
        `Захід «${type.name}» уже згадується в подіях (${type.usageCount}). ` +
          'Заархівуйте його замість видалення.',
      );
    }

    const removed = await this.prismaService.eventType.delete({ where: { id }, include: INCLUDE });

    return toEventType(removed);
  }

  private async findOne(id: string): Promise<EventType> {
    const type = await this.prismaService.eventType.findUnique({ where: { id }, include: INCLUDE });

    if (!type) throw new NotFoundException('Event type not found');

    return toEventType(type);
  }
}

const toEventType = ({
  _count,
  ...type
}: Prisma.EventTypeGetPayload<{ include: typeof INCLUDE }>) => ({
  ...type,
  usageCount: _count.events,
});

export type EventType = ReturnType<typeof toEventType>;
