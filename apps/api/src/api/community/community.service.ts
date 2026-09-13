import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<Community[]> {
    const communities = await this.prismaService.community.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { people: true } } },
    });

    return communities.map(toCommunity);
  }

  public async create({ name }: CreateCommunityDto): Promise<Community> {
    const community = await this.prismaService.community.create({
      data: { name: name.trim() },
      include: { _count: { select: { people: true } } },
    });

    return toCommunity(community);
  }

  public async findOne(id: string): Promise<Community> {
    const community = await this.prismaService.community.findUnique({
      where: { id },
      include: { _count: { select: { people: true } } },
    });
    if (!community) throw new NotFoundException('Community not found');

    return toCommunity(community);
  }

  public async update(id: string, { name }: UpdateCommunityDto): Promise<Community> {
    await this.findOne(id);

    const community = await this.prismaService.community.update({
      where: { id },
      data: name === undefined ? {} : { name: name.trim() },
      include: { _count: { select: { people: true } } },
    });

    return toCommunity(community);
  }

  public async remove(id: string): Promise<Community> {
    await this.findOne(id);

    const community = await this.prismaService.community.delete({
      where: { id },
      include: { _count: { select: { people: true } } },
    });

    return toCommunity(community);
  }
}

const toCommunity = ({ _count, ...community }: CommunityWithCount): Community => ({
  ...community,
  peopleCount: _count.people,
});

type CommunityWithCount = Prisma.CommunityGetPayload<{
  include: { _count: { select: { people: true } } };
}>;

export type Community = {
  id: string;
  name: string;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
