import { Injectable } from '@nestjs/common';

import { Prisma, StepState } from '@generated/prisma/client';
import { careWhere, narrow, scopeWhere, type Viewer } from '@/api/access/visibility';
import { addDays, toChurchDay, toMonthDay } from '@/api/person/filter/people-filter';
import { PrismaService } from '@/infra/prisma/prisma.service';

const BRIEF = { id: true, firstName: true, lastName: true } as const;

/** Порожня умова: користувач без підопічних і без областей бачить порожній огляд. */
const NOBODY: Prisma.PersonWhereInput = { id: { in: [] } };

const OPEN_STEPS = [StepState.PLANNED, StepState.IN_PROGRESS];

/** Скільки днів наперед показуємо дні народження. */
const BIRTHDAY_WINDOW_DAYS = 7;

export type PersonBrief = { id: string; firstName: string; lastName: string | null };

export type Overview = {
  /** Підопічні — головне, з чим працює попечитель. */
  wards: PersonBrief[];
  /** Команди, які довірено: імені й розміру досить, щоб зорієнтуватись. */
  teams: { id: string; kind: string; name: string; peopleCount: number }[];
  /** Хто з підопічних потребує уваги — прапорець пасторський, тож тільки свої. */
  needsAttention: PersonBrief[];
  overdueSteps: { id: string; person: PersonBrief; step: string; dueAt: string }[];
  birthdays: (PersonBrief & { birthDate: string })[];
};

/**
 * Стартова сторінка: тільки своє.
 *
 * «Своє» тут означає буквально — підопічні й довірені області, а не все, до чого
 * є доступ. Адмін бачить усю церкву на сторінці людей; сюди він приходить за
 * власною роботою, і глобальні цифри тут лише заважали б її побачити.
 */
@Injectable()
export class OverviewService {
  constructor(private readonly prismaService: PrismaService) {}

  public async forViewer(viewer: Viewer, now = new Date()): Promise<Overview> {
    const today = toChurchDay(now);
    // Підопічні — для пасторського, підопічні разом з областями — для решти.
    const care = careWhere(viewer.personId);
    const mine = this.mine(viewer);

    const [wards, teams, needsAttention, overdueSteps, birthdays] = await Promise.all([
      this.wards(viewer),
      this.teams(viewer),
      this.people({ careNeeded: true }, care ?? NOBODY, 20),
      this.overdueSteps(care ?? NOBODY, today),
      this.birthdays(mine, today),
    ]);

    return { wards, teams, needsAttention, overdueSteps, birthdays };
  }

  /** Свої люди: підопічні плюс ті, що в довірених областях. */
  private mine(viewer: Viewer): Prisma.PersonWhereInput {
    const branches = [careWhere(viewer.personId), scopeWhere(viewer.scopes)].filter(
      (branch): branch is Prisma.PersonWhereInput => branch !== null,
    );

    if (branches.length === 0) return NOBODY;

    return branches.length === 1 ? branches[0] : { OR: branches };
  }

  private async wards(viewer: Viewer): Promise<PersonBrief[]> {
    if (viewer.personId === null) return [];

    const cares = await this.prismaService.personCare.findMany({
      where: { caregiverId: viewer.personId, until: null },
      select: { person: { select: BRIEF } },
      orderBy: [{ person: { lastName: 'asc' } }, { person: { firstName: 'asc' } }],
    });

    return cares.map(({ person }) => person);
  }

  private async teams(viewer: Viewer): Promise<Overview['teams']> {
    const counted = await Promise.all(
      viewer.scopes.map(async (scope) => {
        if (scope.communityId) {
          return this.team('community', scope.communityId, {
            communities: { some: { id: scope.communityId } },
          });
        }

        if (scope.homeGroupId) {
          return this.team('homeGroup', scope.homeGroupId, { homeGroupId: scope.homeGroupId });
        }

        if (scope.trainingId) {
          return this.team('training', scope.trainingId, {
            trainings: { some: { id: scope.trainingId } },
          });
        }

        if (scope.ministryId) {
          return this.team('ministry', scope.ministryId, {
            ministryAssignments: { some: { ministryId: scope.ministryId, until: null } },
          });
        }

        return null;
      }),
    );

    return counted.filter((team): team is Overview['teams'][number] => team !== null);
  }

  private async team(
    kind: 'community' | 'homeGroup' | 'ministry' | 'training',
    id: string,
    where: Prisma.PersonWhereInput,
  ): Promise<Overview['teams'][number] | null> {
    const source = this.prismaService[kind] as unknown as {
      findUnique: (args: unknown) => Promise<{ name: string } | null>;
    };
    const [entity, peopleCount] = await Promise.all([
      source.findUnique({ where: { id }, select: { name: true } }),
      this.prismaService.person.count({ where }),
    ]);

    return entity ? { id, kind, name: entity.name, peopleCount } : null;
  }

  private async people(
    where: Prisma.PersonWhereInput,
    visibility: Prisma.PersonWhereInput | undefined,
    take: number,
  ): Promise<PersonBrief[]> {
    return this.prismaService.person.findMany({
      where: narrow(where, visibility),
      select: BRIEF,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take,
    });
  }

  private async overdueSteps(
    visibility: Prisma.PersonWhereInput | undefined,
    today: Date,
  ): Promise<Overview['overdueSteps']> {
    const steps = await this.prismaService.personStep.findMany({
      where: {
        state: { in: OPEN_STEPS },
        dueAt: { lt: today },
        person: visibility ?? {},
      },
      select: {
        id: true,
        dueAt: true,
        stepType: { select: { name: true } },
        person: { select: BRIEF },
      },
      orderBy: { dueAt: 'asc' },
      take: 20,
    });

    // dueAt у запиті обовʼязково менший за сьогодні, тож null тут бути не може.
    return steps.map(({ id, dueAt, stepType, person }) => ({
      id,
      person,
      step: stepType.name,
      dueAt: toDay(dueAt as Date),
    }));
  }

  private async birthdays(
    visibility: Prisma.PersonWhereInput | undefined,
    today: Date,
  ): Promise<Overview['birthdays']> {
    const from = toMonthDay(today);
    const to = toMonthDay(addDays(today, BIRTHDAY_WINDOW_DAYS));
    // Вікно, що переходить через 31 грудня, продовжується з 1 січня.
    const window: Prisma.PersonWhereInput =
      from <= to
        ? { birthMd: { gte: from, lte: to } }
        : { OR: [{ birthMd: { gte: from } }, { birthMd: { lte: to } }] };

    const people = await this.prismaService.person.findMany({
      where: narrow(window, visibility),
      select: { ...BRIEF, birthDate: true, birthMd: true },
      orderBy: { birthMd: 'asc' },
      take: 20,
    });

    return people
      .filter((person) => person.birthDate !== null)
      .map(({ id, firstName, lastName, birthDate }) => ({
        id,
        firstName,
        lastName,
        birthDate: toDay(birthDate as Date),
      }));
  }
}

const toDay = (date: Date) => date.toISOString().slice(0, 10);
