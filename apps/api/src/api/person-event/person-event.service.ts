import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ActivityKind, PersonEventKind, Prisma } from '@generated/prisma/client';
import { ActivityService, type Actor } from '@/api/activity/activity.service';
import { PrismaService } from '@/infra/prisma/prisma.service';

import { CreatePersonEventDto, UpdatePersonEventDto } from './dto/person-event.dto';
import { describeEvent } from './person-event.utils';

const EVENT_INCLUDE = {
  withPerson: { select: { id: true, firstName: true, lastName: true } },
} as const satisfies Prisma.PersonEventInclude;

@Injectable()
export class PersonEventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  public async findForPerson(personId: string): Promise<PersonEvent[]> {
    return this.prismaService.personEvent.findMany({
      where: { personId },
      include: EVENT_INCLUDE,
      orderBy: { occurredAt: 'desc' },
    });
  }

  public async create(
    personId: string,
    dto: CreatePersonEventDto,
    actor: Actor,
  ): Promise<PersonEvent> {
    const kind = dto.kind ?? PersonEventKind.EVENT;

    if (kind === PersonEventKind.EVENT && !dto.title?.trim()) {
      throw new BadRequestException('Подія життя потребує назви');
    }

    const event = await this.prismaService.personEvent.create({
      data: {
        personId,
        ...toEventData({ ...dto, kind }),
        occurredAt: new Date(dto.occurredAt),
      },
      include: EVENT_INCLUDE,
    });

    await this.log(personId, ActivityKind.EVENT_ADDED, event, actor, {
      newValue: toDay(event.occurredAt),
    });

    return event;
  }

  public async update(
    personId: string,
    id: string,
    dto: UpdatePersonEventDto,
    actor: Actor,
  ): Promise<PersonEvent> {
    const before = await this.findOne(personId, id);

    const event = await this.prismaService.personEvent.update({
      where: { id },
      data: toEventData(dto),
      include: EVENT_INCLUDE,
    });

    // Нотатку правлять часто, тож у журнал іде лише зміна суті: що і коли.
    const isChanged =
      describeEvent(before) !== describeEvent(event) ||
      toDay(before.occurredAt) !== toDay(event.occurredAt);

    if (isChanged) {
      await this.log(personId, ActivityKind.EVENT_CHANGED, event, actor, {
        oldValue: `${describeEvent(before)} · ${toDay(before.occurredAt)}`,
        newValue: `${describeEvent(event)} · ${toDay(event.occurredAt)}`,
      });
    }

    return event;
  }

  public async remove(personId: string, id: string, actor: Actor): Promise<PersonEvent> {
    const event = await this.findOne(personId, id);

    await this.prismaService.personEvent.delete({ where: { id } });
    await this.log(personId, ActivityKind.EVENT_REMOVED, event, actor, {
      oldValue: toDay(event.occurredAt),
    });

    return event;
  }

  private async log(
    personId: string,
    kind: ActivityKind,
    event: PersonEvent,
    actor: Actor,
    values: { oldValue?: string; newValue?: string },
  ): Promise<void> {
    await this.activityService.log(
      personId,
      [
        {
          kind,
          // Журнал говорить про спілкування інакше, ніж про подію життя.
          subject: event.kind === PersonEventKind.EVENT ? 'event' : 'talk',
          target: describeEvent(event),
          ...values,
        },
      ],
      actor,
    );
  }

  private async findOne(personId: string, id: string): Promise<PersonEvent> {
    const event = await this.prismaService.personEvent.findFirst({
      where: { id, personId },
      include: EVENT_INCLUDE,
    });
    if (!event) throw new NotFoundException('Person event not found');

    return event;
  }
}

export const toEventData = ({
  kind,
  title,
  occurredAt,
  note,
  withPersonId,
}: UpdatePersonEventDto) => ({
  ...(kind === undefined ? {} : { kind }),
  // У спілкування власної назви немає: її заміняють вид і співрозмовник.
  ...(title === undefined && kind === undefined
    ? {}
    : {
        title: (kind ?? PersonEventKind.EVENT) === PersonEventKind.EVENT ? (title ?? null) : null,
      }),
  ...(occurredAt === undefined ? {} : { occurredAt: new Date(occurredAt) }),
  ...(note === undefined ? {} : { note }),
  ...(withPersonId === undefined ? {} : { withPersonId }),
});

const toDay = (date: Date) => date.toISOString().slice(0, 10);

export type PersonEvent = Prisma.PersonEventGetPayload<{ include: typeof EVENT_INCLUDE }>;
