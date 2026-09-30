import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, CareOrigin, Prisma, StepState } from '@generated/prisma/client';
import { isAdmin } from '@/api/access/writes';
import type { Viewer } from '@/api/access/visibility';
import { ActivityService, type Actor } from '@/api/activity/activity.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { HandoverDto, QuickAddDto } from './dto/connect.dto';

/** Крок, який конект призначає одразу: далі його або роблять, або передають. */
const FOLLOW_UP_STEP = 'Фолов-ап';

/**
 * Борда перелічує поля поіменно, а не бере картку цілком: `include` віддав би
 * усі скалярні поля людини — разом з нотатками й адресою, — а борді потрібні
 * імʼя, звʼязок і стан фолов-апу.
 */
const BOARD_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  createdAt: true,
  careReceived: {
    where: { origin: CareOrigin.CONNECT, until: null },
    select: { id: true, caregiver: { select: { id: true, firstName: true, lastName: true } } },
  },
  events: {
    where: { eventTypeId: { not: null } },
    select: { id: true, occurredAt: true, eventType: { select: { name: true } } },
    orderBy: { occurredAt: 'desc' },
    take: 1,
  },
  steps: {
    where: { stepType: { name: FOLLOW_UP_STEP } },
    select: { id: true, state: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const satisfies Prisma.PersonSelect;

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
    return this.prismaService.person.findMany({
      where: this.boardScope(viewer),
      select: BOARD_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Чия це борда. Служитель веде тих, кого привів сам, — чужі нові люди не його
   * робота, а отже й не його доступ. Адмін дивиться на борду спільноти цілком:
   * йому потрібно бачити саме тих, хто на ній засидівся.
   */
  private boardScope(viewer: Viewer): Prisma.PersonWhereInput {
    const communityIds = this.communitiesOf(viewer);
    const open = { origin: CareOrigin.CONNECT, until: null };

    if (isAdmin(viewer)) {
      return {
        communities: { some: { id: { in: communityIds } } },
        careReceived: { some: open },
      };
    }

    // Без звʼязку з людиною в базі служитель нікого не привів — і борда порожня.
    if (viewer.personId === null) return { id: { in: [] } };

    return {
      communities: { some: { id: { in: communityIds } } },
      careReceived: { some: { ...open, caregiverId: viewer.personId } },
    };
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
      select: BOARD_SELECT,
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
    // Передати можна лише свого: інакше служитель забирав би людей у колег.
    const person = await this.prismaService.person.findFirst({
      where: { id: personId, ...this.boardScope(viewer) },
      select: BOARD_SELECT,
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
      select: BOARD_SELECT,
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

export type BoardPerson = Prisma.PersonGetPayload<{ select: typeof BOARD_SELECT }>;
