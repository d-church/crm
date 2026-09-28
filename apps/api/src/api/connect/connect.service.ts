import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, CareOrigin, Prisma, StepState } from '@generated/prisma/client';
import type { Viewer } from '@/api/access/visibility';
import { ActivityService, type Actor } from '@/api/activity/activity.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { HandoverDto, QuickAddDto } from './dto/connect.dto';

/** Крок, який конект призначає одразу: далі його або роблять, або передають. */
const FOLLOW_UP_STEP = 'Фолов-ап';

const BOARD_INCLUDE = {
  careReceived: {
    where: { origin: CareOrigin.CONNECT, until: null },
    include: { caregiver: { select: { id: true, firstName: true, lastName: true } } },
  },
  events: {
    where: { eventTypeId: { not: null } },
    include: { eventType: { select: { name: true } } },
    orderBy: { occurredAt: 'desc' },
    take: 1,
  },
  steps: {
    where: { stepType: { name: FOLLOW_UP_STEP } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const satisfies Prisma.PersonInclude;

/**
 * Конект: не «додати контакт», а відкрити людині шлях. З одного екрана постає
 * картка, подія знайомства, опіка служителя і крок «фолов-ап» — тобто одразу
 * видно, хто за людину відповідає і що має бути зроблене наступним.
 */
@Injectable()
export class ConnectService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  public async board(viewer: Viewer): Promise<BoardPerson[]> {
    const communityIds = this.communitiesOf(viewer);

    return this.prismaService.person.findMany({
      where: {
        communities: { some: { id: { in: communityIds } } },
        careReceived: { some: { origin: CareOrigin.CONNECT, until: null } },
      },
      include: BOARD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  public async quickAdd(dto: QuickAddDto, actor: Actor, viewer: Viewer): Promise<BoardPerson> {
    const [communityId] = this.communitiesOf(viewer);

    if (viewer.personId === null) {
      throw new BadRequestException(
        'Обліковий запис не звʼязаний з людиною в базі — без цього опіку призначити нікому',
      );
    }

    const [eventType, followUp] = await Promise.all([
      this.prismaService.eventType.findUnique({ where: { id: dto.eventTypeId } }),
      this.prismaService.stepType.findFirst({ where: { name: FOLLOW_UP_STEP } }),
    ]);

    if (!eventType) throw new NotFoundException('Захід не знайдено');
    if (!followUp) throw new NotFoundException(`У довіднику кроків немає «${FOLLOW_UP_STEP}»`);

    const person = await this.prismaService.person.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName ?? null,
        phone: dto.phone ?? null,
        communities: { connect: { id: communityId } },
        events: {
          create: { eventTypeId: eventType.id, occurredAt: new Date(), title: eventType.name },
        },
        careReceived: {
          create: { caregiverId: viewer.personId, origin: CareOrigin.CONNECT },
        },
        steps: {
          create: {
            stepTypeId: followUp.id,
            state: StepState.PLANNED,
            responsibleId: viewer.personId,
          },
        },
      },
      include: BOARD_INCLUDE,
    });

    await this.activityService.log(
      person.id,
      [
        { kind: ActivityKind.PERSON_CREATED, subject: 'person' },
        { kind: ActivityKind.EVENT_ADDED, subject: 'event', target: eventType.name },
      ],
      actor,
    );

    return person;
  }

  /**
   * Передати колезі: разом ідуть і фолов-ап, і ведення. Інакше вийшло б, що крок
   * робить один, а картку бачить інший.
   */
  public async handover(
    personId: string,
    { caregiverId }: HandoverDto,
    actor: Actor,
    viewer: Viewer,
  ): Promise<BoardPerson> {
    const communityIds = this.communitiesOf(viewer);
    const person = await this.prismaService.person.findFirst({
      where: {
        id: personId,
        communities: { some: { id: { in: communityIds } } },
        careReceived: { some: { origin: CareOrigin.CONNECT, until: null } },
      },
      include: BOARD_INCLUDE,
    });

    if (!person) throw new NotFoundException('Людини немає на вашій борді');
    if (caregiverId === personId) {
      throw new BadRequestException('Людина не може вести сама себе');
    }

    const caregiver = await this.prismaService.person.findUnique({
      where: { id: caregiverId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!caregiver) throw new NotFoundException('Служителя не знайдено');

    await this.prismaService.$transaction([
      this.prismaService.personCare.updateMany({
        where: { personId, origin: CareOrigin.CONNECT, until: null },
        data: { until: new Date() },
      }),
      this.prismaService.personCare.create({
        data: { personId, caregiverId, origin: CareOrigin.CONNECT },
      }),
      this.prismaService.personStep.updateMany({
        where: { personId, stepType: { name: FOLLOW_UP_STEP } },
        data: { responsibleId: caregiverId },
      }),
    ]);

    await this.activityService.log(
      personId,
      [
        {
          kind: ActivityKind.RELATION_ADDED,
          subject: 'care',
          target: [caregiver.firstName, caregiver.lastName].filter(Boolean).join(' '),
        },
      ],
      actor,
    );

    return this.prismaService.person.findUniqueOrThrow({
      where: { id: personId },
      include: BOARD_INCLUDE,
    });
  }

  /** Конект працює в межах своєї спільноти — іншої в нього просто немає. */
  private communitiesOf(viewer: Viewer): string[] {
    const communityIds = viewer.scopes
      .map(({ communityId }) => communityId)
      .filter((id): id is string => id !== null);

    if (communityIds.length === 0) {
      throw new BadRequestException('Команді конекту не призначено жодної спільноти');
    }

    return communityIds;
  }
}

export type BoardPerson = Prisma.PersonGetPayload<{ include: typeof BOARD_INCLUDE }>;
