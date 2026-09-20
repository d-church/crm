import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

const TRAINING_INCLUDE = {
  leader: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { people: true } },
} as const satisfies Prisma.TrainingInclude;

@Injectable()
export class TrainingService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<Training[]> {
    const trainings = await this.prismaService.training.findMany({
      orderBy: { name: 'asc' },
      include: TRAINING_INCLUDE,
    });

    return trainings.map(toTraining);
  }

  public async create(dto: CreateTrainingDto): Promise<Training> {
    const training = await this.prismaService.training.create({
      data: toTrainingCreateData(dto),
      include: TRAINING_INCLUDE,
    });

    return toTraining(training);
  }

  public async findOne(id: string): Promise<Training> {
    const training = await this.prismaService.training.findUnique({
      where: { id },
      include: TRAINING_INCLUDE,
    });
    if (!training) throw new NotFoundException('Training not found');

    return toTraining(training);
  }

  public async update(id: string, dto: UpdateTrainingDto): Promise<Training> {
    await this.findOne(id);

    const training = await this.prismaService.training.update({
      where: { id },
      data: toTrainingUpdateData(dto),
      include: TRAINING_INCLUDE,
    });

    return toTraining(training);
  }

  public async remove(id: string): Promise<Training> {
    await this.findOne(id);

    const training = await this.prismaService.training.delete({
      where: { id },
      include: TRAINING_INCLUDE,
    });

    return toTraining(training);
  }
}

type TrainingInput = { name?: string | null; leaderId?: string | null };

const toTrainingCreateData = ({ name, leaderId }: CreateTrainingDto) => ({
  name: name.trim(),
  ...(leaderId ? { leader: { connect: { id: leaderId } } } : {}),
});

const toTrainingUpdateData = ({ name, leaderId }: TrainingInput) => ({
  ...(name == null ? {} : { name: name.trim() }),
  ...(leaderId === undefined
    ? {}
    : { leader: leaderId === null ? { disconnect: true } : { connect: { id: leaderId } } }),
});

const toTraining = ({ _count, ...training }: TrainingWithRelations): Training => ({
  ...training,
  peopleCount: _count.people,
});

type TrainingWithRelations = Prisma.TrainingGetPayload<{ include: typeof TRAINING_INCLUDE }>;

export type Training = {
  id: string;
  name: string;
  leader: { id: string; firstName: string; lastName: string | null } | null;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
