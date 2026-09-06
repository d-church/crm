import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateCommunityDto } from './dto/create-community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<Community[]> {
    const communities = await this.prismaService.community.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { people: true } } },
    });

    return communities.map(({ _count, ...community }) => ({
      ...community,
      peopleCount: _count.people,
    }));
  }

  public async create({ name }: CreateCommunityDto): Promise<Community> {
    const community = await this.prismaService.community.create({ data: { name: name.trim() } });

    return { ...community, peopleCount: 0 };
  }
}

export type Community = {
  id: string;
  name: string;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
