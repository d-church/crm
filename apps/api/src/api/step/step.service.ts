import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService, StepState } from '@/infra/prisma/prisma.service';

import { CreateStepDto } from './dto/create-step.dto';
import { CreateStepTypeDto, ReorderStepTypesDto, UpdateStepTypeDto } from './dto/step-type.dto';
import { UpdateStepDto } from './dto/update-step.dto';

const STEP_INCLUDE = { stepType: true } as const satisfies Prisma.PersonStepInclude;

const STEP_TYPE_INCLUDE = {
  _count: { select: { steps: true } },
} as const satisfies Prisma.StepTypeInclude;

/** Кроки, які ще в роботі. Саме вони цікавлять пасторську команду щодня. */
export const OPEN_STEP_STATES = [StepState.PLANNED, StepState.IN_PROGRESS];

@Injectable()
export class StepService {
  constructor(private readonly prismaService: PrismaService) {}

  /** Довідник кроків. Архівні потрібні лише на сторінці керування. */
  public async findTypes(includeArchived = false): Promise<StepType[]> {
    const types = await this.prismaService.stepType.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: STEP_TYPE_INCLUDE,
    });

    return types.map(toStepType);
  }

  public async createType({ name }: CreateStepTypeDto): Promise<StepType> {
    const last = await this.prismaService.stepType.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const type = await this.prismaService.stepType.create({
      // Новий крок стає в кінець списку, а не перед тими, що вже усталились.
      data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 },
      include: STEP_TYPE_INCLUDE,
    });

    return toStepType(type);
  }

  public async updateType(id: string, dto: UpdateStepTypeDto): Promise<StepType> {
    await this.findType(id);

    const type = await this.prismaService.stepType.update({
      where: { id },
      data: dto,
      include: STEP_TYPE_INCLUDE,
    });

    return toStepType(type);
  }

  /** Порядок задається одним списком, тож він не може розʼїхатись між запитами. */
  public async reorderTypes({ ids }: ReorderStepTypesDto): Promise<StepType[]> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.stepType.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );

    return this.findTypes(true);
  }

  /**
   * Крок, який комусь призначений, видалити не можна — це стерло б історію.
   * Такий крок архівують: він зникає з вибору, але лишається в картках.
   */
  public async removeType(id: string): Promise<StepType> {
    const type = await this.findType(id);

    if (type.usageCount > 0) {
      throw new ConflictException(
        `Крок «${type.name}» уже призначений людям (${type.usageCount}). ` +
          'Заархівуйте його замість видалення.',
      );
    }

    const removed = await this.prismaService.stepType.delete({
      where: { id },
      include: STEP_TYPE_INCLUDE,
    });

    return toStepType(removed);
  }

  private async findType(id: string): Promise<StepType> {
    const type = await this.prismaService.stepType.findUnique({
      where: { id },
      include: STEP_TYPE_INCLUDE,
    });
    if (!type) throw new NotFoundException('Step type not found');

    return toStepType(type);
  }

  public async findForPerson(personId: string): Promise<Step[]> {
    return this.prismaService.personStep.findMany({
      where: { personId },
      include: STEP_INCLUDE,
      orderBy: [{ completedAt: 'desc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  public async create(personId: string, dto: CreateStepDto): Promise<Step> {
    return this.prismaService.personStep.create({
      data: { personId, ...toStepData(dto), stepTypeId: dto.stepTypeId },
      include: STEP_INCLUDE,
    });
  }

  public async update(personId: string, id: string, dto: UpdateStepDto): Promise<Step> {
    await this.findOne(personId, id);

    return this.prismaService.personStep.update({
      where: { id },
      data: toStepData(dto),
      include: STEP_INCLUDE,
    });
  }

  public async remove(personId: string, id: string): Promise<Step> {
    await this.findOne(personId, id);

    return this.prismaService.personStep.delete({ where: { id }, include: STEP_INCLUDE });
  }

  private async findOne(personId: string, id: string): Promise<Step> {
    const step = await this.prismaService.personStep.findFirst({
      where: { id, personId },
      include: STEP_INCLUDE,
    });
    if (!step) throw new NotFoundException('Step not found');

    return step;
  }
}

type StepInput = Partial<Omit<CreateStepDto, 'stepTypeId'>> & { stepTypeId?: string };

/**
 * Завершення кроку саме проставляє дату, якщо її не вказали руками — інакше
 * «зроблено» без дати неможливо відрізнити в історії.
 */
export const toStepData = ({
  stepTypeId,
  state,
  dueAt,
  completedAt,
  note,
  responsible,
}: StepInput) => {
  const isDone = state === StepState.DONE;

  return {
    ...(stepTypeId === undefined ? {} : { stepTypeId }),
    ...(state === undefined ? {} : { state }),
    ...(note === undefined ? {} : { note }),
    ...(responsible === undefined ? {} : { responsible }),
    ...(dueAt === undefined ? {} : { dueAt: toDate(dueAt) }),
    ...(completedAt === undefined
      ? isDone
        ? { completedAt: new Date() }
        : {}
      : { completedAt: toDate(completedAt) }),
    // Крок, який повернули в роботу, більше не має дати завершення.
    ...(state !== undefined && state !== StepState.DONE && completedAt === undefined
      ? { completedAt: null }
      : {}),
  };
};

const toDate = (value: string | null) => (value === null ? null : new Date(value));

const toStepType = ({ _count, ...type }: StepTypeWithCount): StepType => ({
  ...type,
  usageCount: _count.steps,
});

type StepTypeWithCount = Prisma.StepTypeGetPayload<{ include: typeof STEP_TYPE_INCLUDE }>;

export type Step = Prisma.PersonStepGetPayload<{ include: typeof STEP_INCLUDE }>;

export type StepType = Prisma.StepTypeGetPayload<object> & {
  /** Скільком людям цей крок уже призначали — разом із завершеними. */
  usageCount: number;
};
