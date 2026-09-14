import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

const COMMUNITY_INCLUDE = {
  leader: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { people: true } },
} as const satisfies Prisma.CommunityInclude;

@Injectable()
export class CommunityService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<Community[]> {
    const communities = await this.prismaService.community.findMany({
      orderBy: { name: 'asc' },
      include: COMMUNITY_INCLUDE,
    });

    return communities.map(toCommunity);
  }

  public async create(dto: CreateCommunityDto): Promise<Community> {
    const community = await this.prismaService.community.create({
      data: toCommunityCreateData(dto),
      include: COMMUNITY_INCLUDE,
    });

    return toCommunity(community);
  }

  public async findOne(id: string): Promise<Community> {
    const community = await this.prismaService.community.findUnique({
      where: { id },
      include: COMMUNITY_INCLUDE,
    });
    if (!community) throw new NotFoundException('Community not found');

    return toCommunity(community);
  }

  public async update(id: string, dto: UpdateCommunityDto): Promise<Community> {
    await this.findOne(id);

    const community = await this.prismaService.community.update({
      where: { id },
      data: toCommunityUpdateData(dto),
      include: COMMUNITY_INCLUDE,
    });

    return toCommunity(community);
  }

  public async remove(id: string): Promise<Community> {
    await this.findOne(id);

    const community = await this.prismaService.community.delete({
      where: { id },
      include: COMMUNITY_INCLUDE,
    });

    return toCommunity(community);
  }
}

type CommunityInput = {
  name?: string | null;
  leaderId?: string | null;
};

const toCommunityCreateData = ({ name, leaderId }: CreateCommunityDto) => ({
  name: name.trim(),
  ...(leaderId ? { leader: { connect: { id: leaderId } } } : {}),
});

const toCommunityUpdateData = ({ name, leaderId }: CommunityInput) => ({
  ...(name == null ? {} : { name: name.trim() }),
  ...(leaderId === undefined
    ? {}
    : { leader: leaderId === null ? { disconnect: true } : { connect: { id: leaderId } } }),
});

const toCommunity = ({ _count, ...community }: CommunityWithCount): Community => ({
  ...community,
  peopleCount: _count.people,
});

type CommunityWithCount = Prisma.CommunityGetPayload<{ include: typeof COMMUNITY_INCLUDE }>;

export type Community = {
  id: string;
  name: string;
  leader: { id: string; firstName: string; lastName: string | null } | null;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
