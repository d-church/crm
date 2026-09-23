import { Injectable } from '@nestjs/common';

import { ActivityKind, Prisma } from '@generated/prisma/client';
import { describeEvent } from '@/api/person-event/person-event.utils';
import { PrismaService } from '@/infra/prisma/prisma.service';

/** Хто виконав операцію. Імʼя зберігається знімком разом із записом. */
export type Actor = { id: string | null; name: string };

export type ActivityEntry = {
  kind: ActivityKind;
  subject: string;
  target?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
};

/** Один пункт хронології — або подія життя людини, або операція з карткою. */
export type TimelineItem = {
  id: string;
  /** ISO-дата, за якою пункт стоїть у стрічці. */
  at: string;
  category: 'life' | 'card';
  kind: string;
  subject: string;
  target?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  actorName?: string | null;
};

const PERSON_FOR_TIMELINE = {
  include: {
    events: { include: { withPerson: { select: { firstName: true, lastName: true } } } },
    steps: { include: { stepType: true } },
    churchRoles: { include: { roleType: true } },
    ministryAssignments: { include: { ministry: true } },
    activities: { orderBy: { createdAt: 'asc' } },
  },
} as const satisfies Prisma.PersonDefaultArgs;

@Injectable()
export class ActivityService {
  constructor(private readonly prismaService: PrismaService) {}

  /** Нічого не змінилось — нічого й не пишемо, щоб журнал не заростав шумом. */
  public async log(personId: string, entries: ActivityEntry[], actor: Actor): Promise<void> {
    if (entries.length === 0) return;

    await this.prismaService.personActivity.createMany({
      data: entries.map((entry) => ({
        personId,
        actorId: actor.id,
        actorName: actor.name,
        ...entry,
      })),
    });
  }

  public async logMany(personIds: string[], entry: ActivityEntry, actor: Actor): Promise<void> {
    if (personIds.length === 0) return;

    await this.prismaService.personActivity.createMany({
      data: personIds.map((personId) => ({
        personId,
        actorId: actor.id,
        actorName: actor.name,
        ...entry,
      })),
    });
  }

  /**
   * Прибирає записи журналу. Саме видалення навмисно не журналюється: інакше
   * чистка шуму породжувала б новий шум замість того, щоб його прибрати.
   */
  public async remove(personId: string, ids: string[]): Promise<{ removed: number }> {
    const { count } = await this.prismaService.personActivity.deleteMany({
      where: { id: { in: ids }, personId },
    });

    return { removed: count };
  }

  /**
   * Хронологія людини: події життя виводяться з її дат і звʼязків, операції —
   * із журналу. Порядок від найдавнішого, бо стрічка починається з народження.
   */
  public async timeline(personId: string): Promise<TimelineItem[]> {
    const person = await this.prismaService.person.findUnique({
      where: { id: personId },
      ...PERSON_FOR_TIMELINE,
    });

    if (!person) return [];

    const life: TimelineItem[] = [
      lifeItem(person.birthDate, 'birth', 'Народження'),
      lifeItem(person.firstVisitAt, 'firstVisit', 'Перший візит'),
      lifeItem(person.baptizedAt, 'baptized', 'Водне хрещення'),
      lifeItem(person.memberSince, 'memberSince', 'Вступ у членство'),
      lifeItem(person.leftAt, 'leftAt', 'Вибуття з членства'),
      lifeItem(person.lastSeenAt, 'lastSeen', 'Остання зустріч'),
      // Нотатку про хід зустрічі показуємо стисло: деталі лишаються в картці.
      ...person.events.map((event) =>
        lifeItem(event.occurredAt, 'event', describeEvent(event), shorten(event.note)),
      ),
      ...person.steps.flatMap((step) =>
        step.completedAt
          ? [lifeItem(step.completedAt, 'stepDone', 'Пройдено крок', step.stepType.name)]
          : [],
      ),
      ...person.churchRoles.flatMap((role) => [
        lifeItem(role.since, 'roleSince', 'Прийняв сан', role.roleType.name),
        lifeItem(role.until, 'roleUntil', 'Склав сан', role.roleType.name),
      ]),
      ...person.ministryAssignments.flatMap((assignment) => [
        lifeItem(assignment.since, 'ministrySince', 'Почав служити', assignment.ministry.name),
        lifeItem(assignment.until, 'ministryUntil', 'Завершив служіння', assignment.ministry.name),
      ]),
    ].filter((item): item is TimelineItem => item !== null);

    const card: TimelineItem[] = person.activities.map((activity) => ({
      id: activity.id,
      at: activity.createdAt.toISOString(),
      category: 'card',
      kind: activity.kind,
      subject: activity.subject,
      target: activity.target,
      oldValue: activity.oldValue,
      newValue: activity.newValue,
      actorName: activity.actorName,
    }));

    return [...life, ...card].sort((a, b) => a.at.localeCompare(b.at));
  }
}

const MAX_NOTE_IN_TIMELINE = 140;

const shorten = (note: string | null): string | undefined => {
  if (!note) return undefined;

  return note.length > MAX_NOTE_IN_TIMELINE ? `${note.slice(0, MAX_NOTE_IN_TIMELINE)}…` : note;
};

const lifeItem = (
  date: Date | null,
  kind: string,
  subject: string,
  target?: string,
): TimelineItem | null =>
  date === null
    ? null
    : {
        id: `${kind}-${date.toISOString()}-${target ?? ''}`,
        at: date.toISOString(),
        category: 'life',
        kind,
        subject,
        target,
      };
