import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';

import { Prisma } from '@generated/prisma/client';
import {
  MinistryRole,
  PrismaService,
  ScopeLevel,
  UserModel,
  UserScopeModel,
} from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

import { CreateUserScopeDto, LinkUserPersonDto, UpdateUserRolesDto } from './dto/access.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

const USER_CACHE_TTL_SECONDS = 60;

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  public async create({
    password,
    confirmPassword,
    email,
    ...userData
  }: CreateUserDto): Promise<User> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Паролі не збігаються');
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prismaService.user.create({
      data: { ...userData, email, password: await hash(password) },
      select: userSelect,
    });

    return user;
  }

  public async findAll(): Promise<UserWithAccess[]> {
    return await this.prismaService.user.findMany({
      select: userWithAccessSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  public async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        ...userSelect,
        password: true,
      },
    });
  }

  public async findById(id: string): Promise<UserWithPassword> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        password: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  public async findOne(id: string): Promise<User> {
    const user = await this.findById(id);

    return toSafeUser(user);
  }

  public async updateProfile(id: string, { firstName, lastName }: UpdateProfileDto): Promise<User> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: { firstName, lastName },
      select: userSelect,
    });

    await this.redisService.del(`user:id:${id}`);

    return user;
  }

  public async changePassword(
    id: string,
    { currentPassword, newPassword, confirmPassword }: ChangePasswordDto,
  ): Promise<void> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Нові паролі не збігаються');
    }

    const user = await this.findById(id);
    const passwordValid = await verify(user.password, currentPassword);

    if (!passwordValid) {
      throw new BadRequestException('Поточний пароль неправильний');
    }

    await this.prismaService.user.update({
      where: { id },
      data: { password: await hash(newPassword) },
      select: { id: true },
    });

    await this.redisService.del(`user:id:${id}`);
  }

  public async updateRole(
    currentUserId: string,
    userId: string,
    { role }: UpdateUserRoleDto,
  ): Promise<User> {
    this.assertDifferentUser(currentUserId, userId, 'змінювати власну роль');
    await this.findOne(userId);

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: { role },
      select: userSelect,
    });

    await this.redisService.del(`user:id:${userId}`);

    return user;
  }

  public async remove(currentUserId: string, userId: string): Promise<User> {
    this.assertDifferentUser(currentUserId, userId, 'видаляти самого себе');
    await this.findOne(userId);

    const user = await this.prismaService.user.delete({
      where: { id: userId },
      select: userSelect,
    });

    await this.redisService.del(`user:id:${userId}`);

    return user;
  }

  public async findByIdForAuth(id: string): Promise<AuthUser> {
    const user = await this.redisService.retrieve<AuthUser | null>({
      key: `user:id:${id}`,
      ttl: USER_CACHE_TTL_SECONDS,
      strategy: async () =>
        this.prismaService.user.findUnique({
          where: { id },
          select: authUserSelect,
        }),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Ролі набором. Суперадмін не міняє їх собі — інакше можна зняти собі доступ
   * і лишити систему без жодного суперадміна.
   */
  public async updateRoles(
    currentUserId: string,
    userId: string,
    { roles }: UpdateUserRolesDto,
  ): Promise<UserWithAccess> {
    this.assertDifferentUser(currentUserId, userId, 'змінювати власні ролі');
    await this.findOne(userId);

    return this.saveAccess(userId, { roles });
  }

  /** Звʼязок з людиною: звідси беруться підопічні й підказки про лідерство. */
  public async linkPerson(
    userId: string,
    { personId }: LinkUserPersonDto,
  ): Promise<UserWithAccess> {
    await this.findOne(userId);

    if (personId) {
      const person = await this.prismaService.person.findUnique({
        where: { id: personId },
        select: { id: true },
      });

      if (!person) throw new NotFoundException('Person not found');
    }

    return this.saveAccess(userId, {
      person: personId ? { connect: { id: personId } } : { disconnect: true },
    });
  }

  /**
   * Що ця людина веде, але ще не довірене її обліковому запису. Лідерство саме по
   * собі доступу не дає — його міняють у картці мимохідь, — але підказати варто:
   * інакше адмін мусить памʼятати всю структуру церкви напамʼять.
   */
  public async suggestedScopes(userId: string): Promise<SuggestedScope[]> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        personId: true,
        scopes: {
          select: { communityId: true, homeGroupId: true, ministryId: true, trainingId: true },
        },
      },
    });

    if (!user?.personId) return [];

    const [communities, homeGroups, ministries, trainings] = await Promise.all([
      this.prismaService.community.findMany({
        where: { leaderId: user.personId },
        select: { id: true, name: true },
      }),
      this.prismaService.homeGroup.findMany({
        where: { leaderId: user.personId },
        select: { id: true, name: true },
      }),
      this.prismaService.ministry.findMany({
        where: {
          assignments: {
            some: { personId: user.personId, role: MinistryRole.LEADER, until: null },
          },
        },
        select: { id: true, name: true },
      }),
      this.prismaService.training.findMany({
        where: { leaderId: user.personId },
        select: { id: true, name: true },
      }),
    ]);

    const taken = new Set(
      user.scopes.flatMap((scope) =>
        [scope.communityId, scope.homeGroupId, scope.ministryId, scope.trainingId].filter(Boolean),
      ),
    );

    return [
      ...communities.map((item) => ({ ...item, kind: 'community' as const })),
      ...homeGroups.map((item) => ({ ...item, kind: 'homeGroup' as const })),
      ...ministries.map((item) => ({ ...item, kind: 'ministry' as const })),
      ...trainings.map((item) => ({ ...item, kind: 'training' as const })),
    ].filter(({ id }) => !taken.has(id));
  }

  public async addScope(userId: string, dto: CreateUserScopeDto): Promise<UserScope> {
    await this.findOne(userId);

    const { level, ...targets } = dto;
    const chosen = Object.values(targets).filter((value) => value !== undefined);

    if (chosen.length !== 1) {
      throw new BadRequestException(
        'Область вказує рівно на одну спільноту, групу, служіння або навчання',
      );
    }

    const scope = await this.prismaService.userScope.create({
      data: { userId, ...targets, ...(level === undefined ? {} : { level }) },
    });

    await this.redisService.del(`user:id:${userId}`);

    return scope;
  }

  public async removeScope(userId: string, scopeId: string): Promise<UserScope> {
    const scope = await this.prismaService.userScope.findFirst({
      where: { id: scopeId, userId },
    });

    if (!scope) throw new NotFoundException('Scope not found');

    await this.prismaService.userScope.delete({ where: { id: scopeId } });
    await this.redisService.del(`user:id:${userId}`);

    return scope;
  }

  /**
   * Будь-яка зміна доступу скидає кеш користувача: інакше новий доступ почне діяти
   * лише за хвилину, а знятий — так само пізно, що гірше.
   */
  private async saveAccess(userId: string, data: Prisma.UserUpdateInput): Promise<UserWithAccess> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data,
      select: userWithAccessSelect,
    });

    await this.redisService.del(`user:id:${userId}`);

    return user;
  }

  private assertDifferentUser(currentUserId: string, targetUserId: string, action: string): void {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException(`Не можна ${action}`);
    }
  }
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  // Ролі й звʼязок з людиною потрібні на кожному запиті: з них рахується видимість.
  roles: true,
  personId: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Те, що їде в кожному запиті: ролі й області, з яких рахується видимість.
 * Лежить у тому самому кеші, що й користувач, тож зайвих запитів не додає.
 */
const authUserSelect = {
  ...userSelect,
  scopes: {
    select: {
      communityId: true,
      homeGroupId: true,
      ministryId: true,
      trainingId: true,
      level: true,
    },
  },
};

const name = { select: { id: true, name: true } };

/** Те, що показує адмінка: області з назвами, а не з ідентифікаторами. */
const userWithAccessSelect = {
  ...userSelect,
  person: { select: { id: true, firstName: true, lastName: true } },
  scopes: {
    select: {
      id: true,
      level: true,
      community: name,
      homeGroup: name,
      ministry: name,
      training: name,
    },
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.UserSelect;

export type User = Pick<UserModel, keyof typeof userSelect>;
export type UserWithPassword = User & Pick<UserModel, 'password'>;
export type UserScope = UserScopeModel;
export type SuggestedScope = {
  id: string;
  name: string;
  kind: 'community' | 'homeGroup' | 'ministry' | 'training';
};
export type UserWithAccess = Prisma.UserGetPayload<{ select: typeof userWithAccessSelect }>;
export type AuthUser = User & {
  scopes: {
    communityId: string | null;
    homeGroupId: string | null;
    ministryId: string | null;
    trainingId: string | null;
    level: ScopeLevel;
  }[];
};

export function toSafeUser(user: UserWithPassword): User {
  const safe = { ...user } as Partial<UserWithPassword>;

  delete safe.password;

  return safe as User;
}
