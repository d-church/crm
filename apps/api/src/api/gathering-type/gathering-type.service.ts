import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import {
  CreateGatheringTypeDto,
  ReorderGatheringTypesDto,
  UpdateGatheringTypeDto,
} from './dto/gathering-type.dto';

const INCLUDE = {
  _count: { select: { gatherings: true } },
} as const satisfies Prisma.GatheringTypeInclude;

/**
 * Довідник видів зібрань: домашня група, недільне служіння, молитва, конференція.
 * Окремо від «заходів» конекту: там записують, де познайомились, тут — що за зібрання.
 */
@Injectable()
export class GatheringTypeService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(includeArchived = false): Promise<GatheringType[]> {
    const types = await this.prismaService.gatheringType.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: INCLUDE,
    });

    return types.map(toGatheringType);
  }

  public async create({ name }: CreateGatheringTypeDto): Promise<GatheringType> {
    const last = await this.prismaService.gatheringType.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const type = await this.prismaService.gatheringType.create({
      // Новий захід стає в кінець списку, а не перед тими, що вже усталились.
      data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 },
      include: INCLUDE,
    });

    return toGatheringType(type);
  }

  public async update(id: string, dto: UpdateGatheringTypeDto): Promise<GatheringType> {
    await this.findOne(id);

    const type = await this.prismaService.gatheringType.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });

    return toGatheringType(type);
  }

  /** Порядок задається одним списком, тож він не може розʼїхатись між запитами. */
  public async reorder({ ids }: ReorderGatheringTypesDto): Promise<GatheringType[]> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.gatheringType.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );

    return this.findAll(true);
  }

  /**
   * Захід, на який уже посилаються події, видалити не можна — це стерло б історію
   * знайомств. Такий захід архівують: він зникає з вибору, але лишається в картках.
   */
  public async remove(id: string): Promise<GatheringType> {
    const type = await this.findOne(id);

    if (type.usageCount > 0) {
      throw new ConflictException(
        `Вид зібрання «${type.name}» уже вжито в зібраннях (${type.usageCount}). ` +
          'Заархівуйте його замість видалення.',
      );
    }

    const removed = await this.prismaService.gatheringType.delete({
      where: { id },
      include: INCLUDE,
    });

    return toGatheringType(removed);
  }

  private async findOne(id: string): Promise<GatheringType> {
    const type = await this.prismaService.gatheringType.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!type) throw new NotFoundException('Event type not found');

    return toGatheringType(type);
  }
}

const toGatheringType = ({
  _count,
  ...type
}: Prisma.GatheringTypeGetPayload<{ include: typeof INCLUDE }>) => ({
  ...type,
  usageCount: _count.gatherings,
});

export type GatheringType = ReturnType<typeof toGatheringType>;
