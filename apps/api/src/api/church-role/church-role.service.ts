import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, Prisma } from '@generated/prisma/client';
import { ActivityService, type Actor } from '@/api/activity/activity.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import {
  CreateChurchRoleDto,
  CreateChurchRoleTypeDto,
  ReorderChurchRoleTypesDto,
  UpdateChurchRoleDto,
  UpdateChurchRoleTypeDto,
} from './dto/church-role.dto';

const ROLE_INCLUDE = { roleType: true } as const satisfies Prisma.ChurchRoleInclude;

const ROLE_TYPE_INCLUDE = {
  _count: { select: { roles: true } },
} as const satisfies Prisma.ChurchRoleTypeInclude;

@Injectable()
export class ChurchRoleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  /** Довідник санів. Архівні потрібні лише на сторінці керування. */
  public async findTypes(includeArchived = false): Promise<ChurchRoleType[]> {
    const types = await this.prismaService.churchRoleType.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: ROLE_TYPE_INCLUDE,
    });

    return types.map(toRoleType);
  }

  public async createType({ name }: CreateChurchRoleTypeDto): Promise<ChurchRoleType> {
    const last = await this.prismaService.churchRoleType.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const type = await this.prismaService.churchRoleType.create({
      data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 },
      include: ROLE_TYPE_INCLUDE,
    });

    return toRoleType(type);
  }

  public async updateType(id: string, dto: UpdateChurchRoleTypeDto): Promise<ChurchRoleType> {
    await this.findType(id);

    const type = await this.prismaService.churchRoleType.update({
      where: { id },
      data: dto,
      include: ROLE_TYPE_INCLUDE,
    });

    return toRoleType(type);
  }

  /** Порядок задається одним списком, тож він не розʼїдеться між запитами. */
  public async reorderTypes({ ids }: ReorderChurchRoleTypesDto): Promise<ChurchRoleType[]> {
    await this.prismaService.$transaction(
      ids.map((id, index) =>
        this.prismaService.churchRoleType.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );

    return this.findTypes(true);
  }

  /** Сан, який комусь призначений, видалити не можна — це стерло б історію. */
  public async removeType(id: string): Promise<ChurchRoleType> {
    const type = await this.findType(id);

    if (type.usageCount > 0) {
      throw new ConflictException(
        `Сан «${type.name}» уже призначений людям (${type.usageCount}). ` +
          'Заархівуйте його замість видалення.',
      );
    }

    const removed = await this.prismaService.churchRoleType.delete({
      where: { id },
      include: ROLE_TYPE_INCLUDE,
    });

    return toRoleType(removed);
  }

  public async findForPerson(personId: string): Promise<ChurchRole[]> {
    return this.prismaService.churchRole.findMany({
      where: { personId },
      include: ROLE_INCLUDE,
      // Діючі сани першими, далі завершені — від найсвіжішого.
      orderBy: [{ until: { sort: 'asc', nulls: 'first' } }, { since: 'desc' }],
    });
  }

  public async create(
    personId: string,
    dto: CreateChurchRoleDto,
    actor: Actor,
  ): Promise<ChurchRole> {
    const role = await this.prismaService.churchRole.create({
      data: { personId, roleTypeId: dto.roleTypeId, ...toRoleData(dto) },
      include: ROLE_INCLUDE,
    });

    await this.activityService.log(
      personId,
      [{ kind: ActivityKind.ROLE_ASSIGNED, subject: 'churchRole', target: role.roleType.name }],
      actor,
    );

    return role;
  }

  public async update(
    personId: string,
    id: string,
    dto: UpdateChurchRoleDto,
    actor: Actor,
  ): Promise<ChurchRole> {
    const before = await this.findOne(personId, id);

    const role = await this.prismaService.churchRole.update({
      where: { id },
      data: toRoleData(dto),
      include: ROLE_INCLUDE,
    });

    // Завершення сану — подія, зміна дати початку — ні.
    if (before.until === null && role.until !== null) {
      await this.activityService.log(
        personId,
        [{ kind: ActivityKind.ROLE_CHANGED, subject: 'churchRole', target: role.roleType.name }],
        actor,
      );
    }

    return role;
  }

  public async remove(personId: string, id: string, actor: Actor): Promise<ChurchRole> {
    const role = await this.findOne(personId, id);

    await this.prismaService.churchRole.delete({ where: { id } });
    await this.activityService.log(
      personId,
      [{ kind: ActivityKind.ROLE_REMOVED, subject: 'churchRole', target: role.roleType.name }],
      actor,
    );

    return role;
  }

  private async findOne(personId: string, id: string): Promise<ChurchRole> {
    const role = await this.prismaService.churchRole.findFirst({
      where: { id, personId },
      include: ROLE_INCLUDE,
    });
    if (!role) throw new NotFoundException('Church role not found');

    return role;
  }

  private async findType(id: string): Promise<ChurchRoleType> {
    const type = await this.prismaService.churchRoleType.findUnique({
      where: { id },
      include: ROLE_TYPE_INCLUDE,
    });
    if (!type) throw new NotFoundException('Church role type not found');

    return toRoleType(type);
  }
}

/** Дати приходять рядком, а порожнє значення має чистити колонку. */
export const toRoleData = ({ since, until }: UpdateChurchRoleDto) => ({
  ...(since === undefined ? {} : { since: toDate(since) }),
  ...(until === undefined ? {} : { until: toDate(until) }),
});

const toDate = (value: string | null) => (value === null ? null : new Date(value));

const toRoleType = ({ _count, ...type }: RoleTypeWithCount): ChurchRoleType => ({
  ...type,
  usageCount: _count.roles,
});

type RoleTypeWithCount = Prisma.ChurchRoleTypeGetPayload<{ include: typeof ROLE_TYPE_INCLUDE }>;

export type ChurchRole = Prisma.ChurchRoleGetPayload<{ include: typeof ROLE_INCLUDE }>;

export type ChurchRoleType = Prisma.ChurchRoleTypeGetPayload<object> & {
  /** Скільком людям сан призначали — разом із завершеними. */
  usageCount: number;
};
