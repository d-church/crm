import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { HomeGroupCategory, PrismaService } from '@/infra/prisma/prisma.service';

import { CreateHomeGroupDto } from './dto/create-home-group.dto';
import { FindHomeGroupsDto } from './dto/find-home-groups.dto';
import { UpdateHomeGroupDto } from './dto/update-home-group.dto';

const HOME_GROUP_INCLUDE = {
  leader: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { people: true } },
} as const satisfies Prisma.HomeGroupInclude;

@Injectable()
export class HomeGroupService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll({ category }: FindHomeGroupsDto = {}): Promise<HomeGroup[]> {
    const homeGroups = await this.prismaService.homeGroup.findMany({
      where: category === undefined ? {} : { category },
      orderBy: { name: 'asc' },
      include: HOME_GROUP_INCLUDE,
    });

    return homeGroups.map(toHomeGroup);
  }

  public async create(dto: CreateHomeGroupDto): Promise<HomeGroup> {
    const homeGroup = await this.prismaService.homeGroup.create({
      data: toHomeGroupCreateData(dto),
      include: HOME_GROUP_INCLUDE,
    });

    return toHomeGroup(homeGroup);
  }

  public async findOne(id: string): Promise<HomeGroup> {
    const homeGroup = await this.prismaService.homeGroup.findUnique({
      where: { id },
      include: HOME_GROUP_INCLUDE,
    });
    if (!homeGroup) throw new NotFoundException('Home group not found');

    return toHomeGroup(homeGroup);
  }

  public async update(id: string, dto: UpdateHomeGroupDto): Promise<HomeGroup> {
    await this.findOne(id);

    const homeGroup = await this.prismaService.homeGroup.update({
      where: { id },
      data: toHomeGroupUpdateData(dto),
      include: HOME_GROUP_INCLUDE,
    });

    return toHomeGroup(homeGroup);
  }

  public async remove(id: string): Promise<HomeGroup> {
    await this.findOne(id);

    const homeGroup = await this.prismaService.homeGroup.delete({
      where: { id },
      include: HOME_GROUP_INCLUDE,
    });

    return toHomeGroup(homeGroup);
  }
}

type HomeGroupInput = {
  name?: string | null;
  category?: HomeGroupCategory;
  address?: string | null;
  leaderId?: string | null;
};

const toHomeGroupCreateData = ({ name, category, address, leaderId }: CreateHomeGroupDto) => ({
  name: name.trim(),
  category,
  address: toNullableString(address),
  ...(leaderId ? { leader: { connect: { id: leaderId } } } : {}),
});

const toHomeGroupUpdateData = ({ name, category, address, leaderId }: HomeGroupInput) => ({
  ...(name == null ? {} : { name: name.trim() }),
  ...(category === undefined ? {} : { category }),
  ...(address === undefined ? {} : { address: toNullableString(address) }),
  ...(leaderId === undefined
    ? {}
    : { leader: leaderId === null ? { disconnect: true } : { connect: { id: leaderId } } }),
});

const toNullableString = (value: string | null | undefined) => {
  const trimmed = value?.trim();

  return trimmed || null;
};

const toHomeGroup = ({ _count, ...homeGroup }: HomeGroupWithRelations): HomeGroup => ({
  ...homeGroup,
  peopleCount: _count.people,
});

type HomeGroupWithRelations = Prisma.HomeGroupGetPayload<{ include: typeof HOME_GROUP_INCLUDE }>;

export type HomeGroup = {
  id: string;
  name: string;
  category: HomeGroupCategory;
  address: string | null;
  leader: { id: string; firstName: string; lastName: string | null } | null;
  peopleCount: number;
  createdAt: Date;
  updatedAt: Date;
};
