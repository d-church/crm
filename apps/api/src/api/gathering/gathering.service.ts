import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AttendanceStatus, Prisma } from '@generated/prisma/client';
import { gatheringWhere, narrow, visibilityFor, type Viewer } from '@/api/access/visibility';
import { isAdmin } from '@/api/access/writes';
import { PrismaService } from '@/infra/prisma/prisma.service';

import {
  CreateGatheringDto,
  FindGatheringsDto,
  MarkAttendanceDto,
  UpdateGatheringDto,
  type RepeatMode,
} from './dto/gathering.dto';

const SCOPE_KEYS = ['communityId', 'homeGroupId', 'ministryId', 'trainingId'] as const;

const GATHERING_INCLUDE = {
  type: { select: { id: true, name: true } },
  community: { select: { id: true, name: true } },
  homeGroup: { select: { id: true, name: true } },
  ministry: { select: { id: true, name: true } },
  training: { select: { id: true, name: true } },
  _count: { select: { attendances: true } },
} as const satisfies Prisma.GatheringInclude;

const PERSON_BRIEF = { id: true, firstName: true, lastName: true } as const;

/**
 * Календар зібрань і відмітки присутності.
 *
 * Зібрання без області — загальноцерковне, його бачать усі. Решта видно тим, кому
 * довірено відповідну область, і це та сама умова, що ріже людей у решті системи.
 */
@Injectable()
export class GatheringService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findAll(query: FindGatheringsDto, viewer: Viewer): Promise<Gathering[]> {
    const period: Prisma.GatheringWhereInput = {
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(`${query.to.slice(0, 10)}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };
    const visible = gatheringWhere(viewer);

    const gatherings = await this.prismaService.gathering.findMany({
      where: visible === undefined ? period : { AND: [period, visible] },
      include: GATHERING_INCLUDE,
      orderBy: { startsAt: 'asc' },
    });

    return this.withPresentCounts(gatherings);
  }

  /**
   * Скільки людей було. Prisma не дає двох різних лічильників в одному `_count`,
   * тож присутніх рахуємо одним додатковим запитом на всю сторінку, а не на кожне
   * зібрання окремо.
   */
  private async withPresentCounts(gatherings: Gathering[]): Promise<Gathering[]> {
    if (gatherings.length === 0) return gatherings;

    const counts = await this.prismaService.attendance.groupBy({
      by: ['gatheringId'],
      where: {
        gatheringId: { in: gatherings.map(({ id }) => id) },
        status: AttendanceStatus.PRESENT,
      },
      _count: { _all: true },
    });
    const present = new Map(counts.map((row) => [row.gatheringId, row._count._all]));

    return gatherings.map((gathering) => ({
      ...gathering,
      presentCount: present.get(gathering.id) ?? 0,
    }));
  }

  public async findOne(id: string, viewer: Viewer): Promise<Gathering> {
    const visible = gatheringWhere(viewer);
    const gathering = await this.prismaService.gathering.findFirst({
      where: visible === undefined ? { id } : { AND: [{ id }, visible] },
      include: GATHERING_INCLUDE,
    });

    if (!gathering) throw new NotFoundException('Gathering not found');

    const [withCount] = await this.withPresentCounts([gathering]);

    return withCount;
  }

  /**
   * Створює зібрання, а за потреби — одразу серію наперед. Повного движка
   * повторень тут немає навмисно: кожне зібрання далі живе окремо, його можна
   * перенести, перейменувати чи видалити, не зачепивши решту.
   */
  public async create(dto: CreateGatheringDto, viewer: Viewer): Promise<Gathering[]> {
    const scope = this.assertSingleScope(dto);

    this.assertMayManage(scope, viewer);

    const { repeat, occurrences = 1, ...rest } = dto;
    const starts = this.occurrenceDates(new Date(dto.startsAt), repeat, occurrences);

    const created = await this.prismaService.$transaction(
      starts.map((startsAt) =>
        this.prismaService.gathering.create({
          data: {
            typeId: rest.typeId,
            title: rest.title ?? null,
            note: rest.note ?? null,
            guestCount: rest.guestCount ?? 0,
            startsAt,
            ...scope,
          },
          include: GATHERING_INCLUDE,
        }),
      ),
    );

    return created;
  }

  public async update(id: string, dto: UpdateGatheringDto, viewer: Viewer): Promise<Gathering> {
    await this.findOne(id, viewer);

    return this.prismaService.gathering.update({
      where: { id },
      data: {
        ...(dto.typeId === undefined ? {} : { typeId: dto.typeId }),
        ...(dto.title === undefined ? {} : { title: dto.title }),
        ...(dto.note === undefined ? {} : { note: dto.note }),
        ...(dto.guestCount === undefined ? {} : { guestCount: dto.guestCount }),
        ...(dto.startsAt === undefined ? {} : { startsAt: new Date(dto.startsAt) }),
      },
      include: GATHERING_INCLUDE,
    });
  }

  public async remove(id: string, viewer: Viewer): Promise<Gathering> {
    const gathering = await this.findOne(id, viewer);

    await this.prismaService.gathering.delete({ where: { id } });

    return gathering;
  }

  /**
   * Кого користувач може відмітити на цьому зібранні: своїх людей і себе самого.
   * Себе — навіть якщо він не входить у жодну свою область: інакше лідер служіння
   * не міг би відмітити власну присутність на загальноцерковному.
   */
  public async roster(id: string, viewer: Viewer): Promise<RosterEntry[]> {
    const gathering = await this.findOne(id, viewer);
    const { rows } = visibilityFor(viewer);

    const scoped = this.scopeOf(gathering);
    // На зібранні групи чи служіння відмічають її учасників, а не всіх своїх.
    const belongs = scoped ? this.membersOf(scoped) : {};
    const where =
      rows === undefined
        ? belongs
        : {
            OR: [narrow(belongs, rows), ...(viewer.personId ? [{ id: viewer.personId }] : [])],
          };

    const [people, marks] = await Promise.all([
      this.prismaService.person.findMany({
        where,
        select: PERSON_BRIEF,
        orderBy: [{ lastName: { sort: 'asc', nulls: 'last' } }, { firstName: 'asc' }],
      }),
      this.prismaService.attendance.findMany({
        where: { gatheringId: id },
        select: { personId: true, status: true },
      }),
    ]);
    const byPerson = new Map(marks.map(({ personId, status }) => [personId, status]));

    return people.map((person) => ({ ...person, status: byPerson.get(person.id) ?? null }));
  }

  /**
   * Хто був і кого не було. На відміну від списку для відмічання, тут лише ті,
   * кого вже відмітили — і тільки ті з них, кого користувачу видно.
   */
  public async attendance(id: string, viewer: Viewer): Promise<AttendanceEntry[]> {
    await this.findOne(id, viewer);

    const { rows } = visibilityFor(viewer);
    const marks = await this.prismaService.attendance.findMany({
      where: { gatheringId: id, ...(rows === undefined ? {} : { person: rows }) },
      select: { status: true, person: { select: PERSON_BRIEF } },
      orderBy: [
        { person: { lastName: { sort: 'asc', nulls: 'last' } } },
        { person: { firstName: 'asc' } },
      ],
    });

    return marks.map(({ status, person }) => ({ ...person, status }));
  }

  /** Відмітки зберігаються пачкою: лідер проставляє галочки й тисне «зберегти» раз. */
  public async mark(
    id: string,
    { marks }: MarkAttendanceDto,
    viewer: Viewer,
    markedBy: { id: string | null; name: string },
  ): Promise<{ saved: number }> {
    const allowed = new Set((await this.roster(id, viewer)).map((entry) => entry.id));
    const permitted = marks.filter((mark) => allowed.has(mark.personId));

    if (permitted.length === 0) return { saved: 0 };

    await this.prismaService.$transaction(
      permitted.map(({ personId, status }) =>
        this.prismaService.attendance.upsert({
          where: { gatheringId_personId: { gatheringId: id, personId } },
          create: {
            gatheringId: id,
            personId,
            status,
            markedById: markedBy.id,
            markedByName: markedBy.name,
          },
          update: { status, markedById: markedBy.id, markedByName: markedBy.name },
        }),
      ),
    );

    return { saved: permitted.length };
  }

  /** Область зібрання — рівно одне посилання або жодного. */
  private assertSingleScope(dto: CreateGatheringDto): Partial<Record<Scope, string>> {
    const chosen = SCOPE_KEYS.filter((key) => dto[key] !== undefined);

    if (chosen.length > 1) {
      throw new BadRequestException(
        'Зібрання належить одній області: спільноті, групі, служінню або навчанню',
      );
    }

    return chosen.length === 0 ? {} : { [chosen[0]]: dto[chosen[0]] as string };
  }

  /**
   * Створювати зібрання можна в своїй області. Загальноцерковне — лише адмін:
   * воно зʼявиться в календарі всієї церкви.
   */
  private assertMayManage(scope: Partial<Record<Scope, string>>, viewer: Viewer): void {
    if (isAdmin(viewer)) return;

    const [key] = Object.keys(scope) as Scope[];

    if (key === undefined) {
      throw new ForbiddenException('Загальноцерковне зібрання створює адміністратор');
    }

    const owns = viewer.scopes.some((area) => area[key] === scope[key]);

    if (!owns) throw new ForbiddenException('Ця область вам не довірена');
  }

  private scopeOf(gathering: Gathering): { key: Scope; id: string } | null {
    for (const key of SCOPE_KEYS) {
      const id = gathering[key];

      if (id !== null) return { key, id };
    }

    return null;
  }

  /** Хто вважається учасником області зібрання. */
  private membersOf({ key, id }: { key: Scope; id: string }): Prisma.PersonWhereInput {
    switch (key) {
      case 'communityId':
        return { communities: { some: { id } } };

      case 'homeGroupId':
        return { homeGroupId: id };

      case 'trainingId':
        return { trainings: { some: { id } } };

      case 'ministryId':
        return { ministryAssignments: { some: { ministryId: id, until: null } } };
    }
  }

  /** Дати серії. Місячний крок тримається того самого числа, тижневий — того самого дня. */
  private occurrenceDates(first: Date, repeat: RepeatMode | undefined, count: number): Date[] {
    if (repeat === undefined) return [first];

    return Array.from({ length: count }, (_, index) => {
      const date = new Date(first);

      if (repeat === 'monthly') date.setMonth(date.getMonth() + index);
      else date.setDate(date.getDate() + index * (repeat === 'weekly' ? 7 : 14));

      return date;
    });
  }
}

type Scope = (typeof SCOPE_KEYS)[number];

export type Gathering = Prisma.GatheringGetPayload<{ include: typeof GATHERING_INCLUDE }> & {
  /** Скільки людей було. Рахується окремо від загальної кількості відміток. */
  presentCount?: number;
};

export type AttendanceEntry = {
  id: string;
  firstName: string;
  lastName: string | null;
  status: 'PRESENT' | 'ABSENT';
};

export type RosterEntry = {
  id: string;
  firstName: string;
  lastName: string | null;
  status: 'PRESENT' | 'ABSENT' | null;
};
