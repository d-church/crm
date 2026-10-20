import { Injectable } from '@nestjs/common';

import { ActivityState, MembershipStatus, PersonGender, Prisma } from '@generated/prisma/client';
import { narrow, visibilityFor, type Viewer } from '@/api/access/visibility';
import { toChurchDay, toMonthDay } from '@/api/person/filter/people-filter';
import { segmentWhere } from '@/api/person/filter/segment';
import { PrismaService } from '@/infra/prisma/prisma.service';

/** Вікові групи церкви: діти, підлітки, молодь, і далі десятиліттями життя. */
const AGE_GROUPS = [
  { label: 'до 12', from: 0, to: 12 },
  { label: '13–17', from: 13, to: 17 },
  { label: '18–25', from: 18, to: 25 },
  { label: '26–35', from: 26, to: 35 },
  { label: '36–50', from: 36, to: 50 },
  { label: '51–65', from: 51, to: 65 },
  { label: '66+', from: 66, to: 200 },
] as const;

/**
 * Межі правдоподібності. Дата народження приїхала імпортом зі старої бази, і одна
 * описка в році тихо зсуває середній вік усієї церкви — тому такі значення не
 * рахуємо, а показуємо окремо, щоб їх було кому виправити.
 */
const MIN_AGE = 0;
const MAX_AGE = 110;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type Slice = { label: string; value: number };

export type Statistics = {
  /** Скільки активних людей потрапило в розрахунок демографії. */
  active: number;
  age: {
    average: number | null;
    median: number | null;
    /** По скількох порахували — решта без дати народження. */
    counted: number;
    /** Скільки дат виявились неправдоподібними й не рахувалися. */
    ignored: number;
    groups: Slice[];
  };
  gender: Slice[];
  membership: Slice[];
  /** Частки від активних: у служіннях, у домашніх групах, з попечителем. */
  engagement: { inMinistry: number; inHomeGroup: number; withCaregiver: number };
  /** Рух за останні 12 місяців — рахується по всіх, а не лише по активних. */
  year: { arrived: number; baptized: number; becameMembers: number; left: number };
  /** Заповненість полів, від якої залежить чесність цифр вище. */
  filled: { birthDate: number; phone: number; community: number; firstVisit: number };
};

const GENDER_LABELS: Record<PersonGender, string> = {
  MALE: 'Чоловіки',
  FEMALE: 'Жінки',
};

const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  MEMBER: 'Члени церкви',
  ATTENDER: 'Прихожани',
  GUEST: 'Гості',
  SUBSCRIBER: 'Підписники',
  FORMER_MEMBER: 'Колишні члени',
};

/**
 * Цифри про церкву цілком: вік, склад, залученість, рух за рік.
 *
 * Рахується в межах видимості, як і решта лічильників: лідер домашньої групи
 * дивиться на свою групу, адмін — на церкву. Інакше сторінка статистики стала б
 * обхідним шляхом дізнатися розмір бази, не бачачи жодної картки.
 */
@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}

  public async forViewer(viewer: Viewer, segment?: string, now = new Date()): Promise<Statistics> {
    const today = toChurchDay(now);
    const yearAgo = new Date(today.getTime() - YEAR_MS);

    // Дві бази. Демографія — про тих, хто зараз у церкві. Рух за рік — про всіх:
    // інакше ті, хто за цей рік вибув, зникли б із власної ж статистики вибуття.
    const everyone = narrow(
      (await segmentWhere(this.prismaService, segment)) ?? {},
      visibilityFor(viewer).rows,
    );
    const active: Prisma.PersonWhereInput = {
      AND: [everyone, { activity: ActivityState.ACTIVE }],
    };

    const [people, inMinistry, inHomeGroup, withCaregiver, withCommunity, year] = await Promise.all(
      [
        this.prismaService.person.findMany({
          where: active,
          select: {
            birthDate: true,
            gender: true,
            membership: true,
            phone: true,
            firstVisitAt: true,
          },
        }),
        // Колишні учасники служіння не рахуються — лише діючі призначення.
        this.prismaService.person.count({
          where: { AND: [active, { ministryAssignments: { some: { until: null } } }] },
        }),
        this.prismaService.person.count({
          where: { AND: [active, { homeGroupId: { not: null } }] },
        }),
        this.prismaService.person.count({
          where: { AND: [active, { careReceived: { some: { until: null } } }] },
        }),
        this.prismaService.person.count({
          where: { AND: [active, { communities: { some: {} } }] },
        }),
        this.yearFlow(everyone, yearAgo),
      ],
    );

    return {
      active: people.length,
      age: this.ages(
        people.map(({ birthDate }) => birthDate),
        today,
      ),
      gender: this.slices(
        people.map(({ gender }) => gender),
        GENDER_LABELS,
        'Не вказано',
      ),
      membership: this.slices(
        people.map(({ membership }) => membership),
        MEMBERSHIP_LABELS,
        'Не вказано',
      ),
      engagement: { inMinistry, inHomeGroup, withCaregiver },
      year,
      filled: {
        birthDate: people.filter(({ birthDate }) => birthDate !== null).length,
        phone: people.filter(({ phone }) => phone !== null && phone !== '').length,
        community: withCommunity,
        firstVisit: people.filter(({ firstVisitAt }) => firstVisitAt !== null).length,
      },
    };
  }

  /**
   * Рух за останні 12 місяців: скільки прийшло, охрестили, прийняли, скільки вибуло.
   *
   * «Прийшло» рахується за першим візитом, а не за датою створення картки: картку
   * можуть завести через рік після знайомства або залити імпортом тисячею за раз,
   * і тоді дата створення каже про роботу з базою, а не про прихід людей.
   */
  private async yearFlow(everyone: Prisma.PersonWhereInput, since: Date) {
    const [arrived, baptized, becameMembers, left] = await Promise.all([
      this.prismaService.person.count({
        where: { AND: [everyone, { firstVisitAt: { gte: since } }] },
      }),
      this.prismaService.person.count({
        where: { AND: [everyone, { baptizedAt: { gte: since } }] },
      }),
      this.prismaService.person.count({
        where: { AND: [everyone, { memberSince: { gte: since } }] },
      }),
      this.prismaService.person.count({ where: { AND: [everyone, { leftAt: { gte: since } }] } }),
    ]);

    return { arrived, baptized, becameMembers, left };
  }

  /**
   * Середнє поруч із медіаною навмисно: у церкві з дитячим служінням і літніми
   * членами середнє саме по собі не описує нікого, а різниця між ними одразу
   * показує, у який бік перекошений склад.
   */
  private ages(dates: (Date | null)[], today: Date): Statistics['age'] {
    const all = dates
      .filter((date): date is Date => date !== null)
      .map((date) => ageOf(date, today));
    const ages = all.filter((age) => age >= MIN_AGE && age <= MAX_AGE).sort((a, b) => a - b);

    return {
      average:
        ages.length === 0 ? null : round(ages.reduce((sum, age) => sum + age, 0) / ages.length),
      median: ages.length === 0 ? null : median(ages),
      counted: ages.length,
      ignored: all.length - ages.length,
      groups: AGE_GROUPS.map(({ label, from, to }) => ({
        label,
        value: ages.filter((age) => age >= from && age <= to).length,
      })),
    };
  }

  /** Розподіл за довідниковим полем: порожнє значення теж показуємо, а не ховаємо. */
  private slices<T extends string>(
    values: (T | null)[],
    labels: Record<T, string>,
    emptyLabel: string,
  ): Slice[] {
    const counts = new Map<string, number>();

    for (const value of values) {
      const label = value === null ? emptyLabel : labels[value];

      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return [...Object.values<string>(labels), emptyLabel]
      .map((label) => ({ label, value: counts.get(label) ?? 0 }))
      .filter(({ value }) => value > 0);
  }
}

/** Повних років на сьогодні: день народження цього року або ще попереду, або вже був. */
export const ageOf = (birth: Date, today: Date): number => {
  const years = today.getUTCFullYear() - birth.getUTCFullYear();

  return toMonthDay(today) < toMonthDay(birth) ? years - 1 : years;
};

const median = (sorted: number[]): number => {
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
};

const round = (value: number): number => Math.round(value * 10) / 10;
