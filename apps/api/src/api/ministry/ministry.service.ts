import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateMinistryDto } from './dto/create-ministry.dto';
import { FindMinistriesDto } from './dto/find-ministries.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';

const MINISTRY_INCLUDE = {
  community: { select: { id: true, name: true } },
  leader: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { people: true } },
} as const satisfies Prisma.MinistryInclude;

@Injectable()
export class MinistryService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll({ communityId, withoutCommunity }: FindMinistriesDto = {}): Promise<
    Ministry[]
  > {
    const ministries = await this.prismaService.ministry.findMany({
      where:
        withoutCommunity === 'true' ? { communityId: null } : communityId ? { communityId } : {},
      orderBy: [
        { community: { sortOrder: 'asc' } },
        { community: { name: 'asc' } },
        { name: 'asc' },
      ],
      include: MINISTRY_INCLUDE,
    });

    return ministries.map(toMinistry);
  }

  public async create(dto: CreateMinistryDto): Promise<Ministry> {
    const ministry = await this.prismaService.ministry.create({
      data: toMinistryCreateData(dto),
      include: MINISTRY_INCLUDE,
    });

    return toMinistry(ministry);
  }

  public async findOne(id: string): Promise<Ministry> {
    const ministry = await this.prismaService.ministry.findUnique({
      where: { id },
      include: MINISTRY_INCLUDE,
    });
    if (!ministry) throw new NotFoundException('Ministry not found');

    return toMinistry(ministry);
  }

  public async update(id: string, dto: UpdateMinistryDto): Promise<Ministry> {
    await this.findOne(id);

    const ministry = await this.prismaService.ministry.update({
      where: { id },
      data: toMinistryUpdateData(dto),
      include: MINISTRY_INCLUDE,
    });

    return toMinistry(ministry);
  }

  public async remove(id: string): Promise<Ministry> {
    await this.findOne(id);

    const ministry = await this.prismaService.ministry.delete({
      where: { id },
      include: MINISTRY_INCLUDE,
    });

    return toMinistry(ministry);
  }
}

type MinistryInput = {
  name?: string | null;
  communityId?: string | null;
  leaderId?: string | null;
};

const toMinistryCreateData = ({ name, communityId, leaderId }: CreateMinistryDto) => ({
  name: name.trim(),
  ...(communityId ? { community: { connect: { id: communityId } } } : {}),
  ...(leaderId ? { leader: { connect: { id: leaderId } } } : {}),
});

const toMinistryUpdateData = ({ name, communityId, leaderId }: MinistryInput) => ({
  ...(name == null ? {} : { name: name.trim() }),
  ...(communityId === undefined
    ? {}
    : {
        community: communityId === null ? { disconnect: true } : { connect: { id: communityId } },
      }),
  ...(leaderId === undefined
    ? {}
    : { leader: leaderId === null ? { disconnect: true } : { connect: { id: leaderId } } }),
});

const toMinistry = ({ _count, ...ministry }: MinistryWithRelations): Ministry => ({
  ...ministry,
  peopleCount: _count.people,
});

type MinistryWithRelations = Prisma.MinistryGetPayload<{ include: typeof MINISTRY_INCLUDE }>;

export type Ministry = {
  id: string;
  name: string;
  community: { id: string; name: string } | null;
  leader: { id: string; firstName: string; lastName: string | null } | null;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
