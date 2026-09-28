import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, CareOrigin, Prisma } from '@generated/prisma/client';
import { ActivityService, type Actor } from '@/api/activity/activity.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreateCareDto } from './dto/care.dto';

const CARE_INCLUDE = {
  caregiver: { select: { id: true, firstName: true, lastName: true } },
} as const satisfies Prisma.PersonCareInclude;

/** Імʼя попечителя для журналу: ідентифікатор там не читається. */
const nameOf = ({ firstName, lastName }: { firstName: string; lastName: string | null }) =>
  [firstName, lastName].filter(Boolean).join(' ');

@Injectable()
export class CareService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  /** Діючі попечителі й історія: новий попечитель має бачити, хто вів людину до нього. */
  public async findForPerson(personId: string): Promise<Care[]> {
    return this.prismaService.personCare.findMany({
      where: { personId },
      include: CARE_INCLUDE,
      orderBy: [{ until: { sort: 'asc', nulls: 'first' } }, { since: 'desc' }],
    });
  }

  public async create(
    personId: string,
    { caregiverId }: CreateCareDto,
    actor: Actor,
  ): Promise<Care> {
    if (caregiverId === personId) {
      throw new BadRequestException('Людина не може опікуватися сама собою');
    }

    const caregiver = await this.prismaService.person.findUnique({
      where: { id: caregiverId },
      select: { id: true },
    });

    if (!caregiver) throw new NotFoundException('Caregiver not found');

    const existing = await this.prismaService.personCare.findFirst({
      where: { personId, caregiverId, until: null },
    });

    if (existing) throw new BadRequestException('Ця людина вже є попечителем');

    const care = await this.prismaService.personCare.create({
      data: { personId, caregiverId, origin: CareOrigin.ASSIGNED },
      include: CARE_INCLUDE,
    });

    await this.activityService.log(
      personId,
      [{ kind: ActivityKind.RELATION_ADDED, subject: 'care', target: nameOf(care.caregiver) }],
      actor,
    );

    return care;
  }

  /**
   * Опіку не видаляємо, а закриваємо: історія потрібна наступному попечителю.
   * Видалити запис зовсім означало б стерти слід того, хто вів людину.
   */
  public async close(personId: string, id: string, actor: Actor): Promise<Care> {
    const care = await this.prismaService.personCare.findFirst({
      where: { id, personId },
      include: CARE_INCLUDE,
    });

    if (!care) throw new NotFoundException('Care not found');
    if (care.until !== null) return care;

    const closed = await this.prismaService.personCare.update({
      where: { id },
      data: { until: new Date() },
      include: CARE_INCLUDE,
    });

    await this.activityService.log(
      personId,
      [{ kind: ActivityKind.RELATION_REMOVED, subject: 'care', target: nameOf(care.caregiver) }],
      actor,
    );

    return closed;
  }
}

export type Care = Prisma.PersonCareGetPayload<{ include: typeof CARE_INCLUDE }>;
