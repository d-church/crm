import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@generated/prisma/client';
import { MinistryRole, PrismaService } from '@/infra/prisma/prisma.service';

import { CreateMinistryDto } from './dto/create-ministry.dto';
import { FindMinistriesDto } from './dto/find-ministries.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';

const MINISTRY_INCLUDE = {
  community: { select: { id: true, name: true } },
  /// Лише діючі участі: завершені лишаються в базі як історія.
  assignments: {
    where: { until: null },
    include: { person: { select: { id: true, firstName: true, lastName: true } } },
  },
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

  public async create({ leaderId, ...dto }: CreateMinistryDto): Promise<Ministry> {
    const ministry = await this.prismaService.ministry.create({
      data: toMinistryCreateData(dto),
      include: MINISTRY_INCLUDE,
    });

    if (leaderId === undefined) return toMinistry(ministry);

    await this.setLeader(ministry.id, leaderId);

    return this.findOne(ministry.id);
  }

  public async findOne(id: string): Promise<Ministry> {
    const ministry = await this.prismaService.ministry.findUnique({
      where: { id },
      include: MINISTRY_INCLUDE,
    });
    if (!ministry) throw new NotFoundException('Ministry not found');

    return toMinistry(ministry);
  }

  public async update(id: string, { leaderId, ...dto }: UpdateMinistryDto): Promise<Ministry> {
    await this.findOne(id);

    await this.prismaService.ministry.update({
      where: { id },
      data: toMinistryUpdateData(dto),
    });

    if (leaderId !== undefined) await this.setLeader(id, leaderId ?? null);

    return this.findOne(id);
  }

  /**
   * Керівник служіння — це участь із роллю LEADER. Попередній керівник лишається
   * в команді учасником, бо зміна керівника рідко означає, що людина пішла.
   */
  private async setLeader(ministryId: string, leaderId: string | null): Promise<void> {
    await this.prismaService.ministryAssignment.updateMany({
      where: {
        ministryId,
        role: MinistryRole.LEADER,
        until: null,
        NOT: { personId: leaderId ?? '' },
      },
      data: { role: MinistryRole.MEMBER },
    });

    if (!leaderId) return;

    const existing = await this.prismaService.ministryAssignment.findFirst({
      where: { ministryId, personId: leaderId, until: null },
      select: { id: true },
    });

    await (existing
      ? this.prismaService.ministryAssignment.update({
          where: { id: existing.id },
          data: { role: MinistryRole.LEADER },
        })
      : this.prismaService.ministryAssignment.create({
          data: { ministryId, personId: leaderId, role: MinistryRole.LEADER },
        }));
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

const toMinistryCreateData = ({ name, communityId }: Omit<CreateMinistryDto, 'leaderId'>) => ({
  name: name.trim(),
  ...(communityId ? { community: { connect: { id: communityId } } } : {}),
});

const toMinistryUpdateData = ({ name, communityId }: MinistryInput) => ({
  ...(name == null ? {} : { name: name.trim() }),
  ...(communityId === undefined
    ? {}
    : {
        community: communityId === null ? { disconnect: true } : { connect: { id: communityId } },
      }),
});

const toMinistry = ({ assignments, ...ministry }: MinistryWithRelations): Ministry => ({
  ...ministry,
  leader: assignments.find(({ role }) => role === MinistryRole.LEADER)?.person ?? null,
  peopleCount: assignments.length,
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
