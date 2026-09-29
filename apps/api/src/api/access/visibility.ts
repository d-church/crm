import { CareOrigin, Prisma, Role } from '@generated/prisma/client';

/** Область відповідальності, як вона приходить з токена користувача. */
export type ViewerScope = {
  communityId: string | null;
  homeGroupId: string | null;
  ministryId: string | null;
  trainingId: string | null;
};

/** Хто питає. Збирається з автентифікованого користувача, без жодного запиту в базу. */
export type Viewer = {
  id: string;
  /** Ким користувач є в базі людей. Без цього звʼязку опіка не працює. */
  personId: string | null;
  roles: Role[];
  scopes: ViewerScope[];
};

/**
 * Кого користувач бачить. `undefined` означає «усю базу» — так Prisma отримує
 * запит без зайвого `AND`, а не порожню умову, яку легко прийняти за фільтр.
 */
export type Visibility = {
  /** Люди, з якими користувач взагалі працює: списки, картка, масові дії. */
  rows: Prisma.PersonWhereInput | undefined;
  /** Кому відкритий пасторський шар: нотатки, спілкування, кроки, хронологія. */
  pastoral: Prisma.PersonWhereInput | undefined;
};

/**
 * Умова, яка не збігається ні з ким. Потрібна явно: користувач без ролей і без
 * областей не має бачити нічого, і це має виглядати як рішення, а не як недогляд.
 */
export const NOBODY: Prisma.PersonWhereInput = { id: { in: [] } };

const has = (viewer: Viewer, role: Role) => viewer.roles.includes(role);

/** Адмін без жодної області — глобальний: уся база. З областями — лише вона. */
export const isGlobalAdmin = (viewer: Viewer): boolean =>
  has(viewer, Role.SUPERADMIN) || (has(viewer, Role.ADMIN) && viewer.scopes.length === 0);

/**
 * Люди, повʼязані з областями безпосередньо. Область «спільнота» не відкриває
 * людей усіх служінь усередині неї — лише учасників самої спільноти.
 */
export const scopeWhere = (scopes: ViewerScope[]): Prisma.PersonWhereInput | null => {
  const communityIds = ids(scopes, 'communityId');
  const homeGroupIds = ids(scopes, 'homeGroupId');
  const ministryIds = ids(scopes, 'ministryId');
  const trainingIds = ids(scopes, 'trainingId');

  const branches: Prisma.PersonWhereInput[] = [];

  if (communityIds.length > 0)
    branches.push({ communities: { some: { id: { in: communityIds } } } });
  if (homeGroupIds.length > 0) branches.push({ homeGroupId: { in: homeGroupIds } });
  // Колишніх учасників служіння лідер не бачить, тому лише діючі призначення.
  if (ministryIds.length > 0) {
    branches.push({
      ministryAssignments: { some: { ministryId: { in: ministryIds }, until: null } },
    });
  }
  if (trainingIds.length > 0) branches.push({ trainings: { some: { id: { in: trainingIds } } } });

  return branches.length > 0 ? or(branches) : null;
};

/** Підопічні: опіка відкриває доступ сама по собі, без окремої області. */
export const careWhere = (personId: string | null): Prisma.PersonWhereInput | null =>
  personId === null ? null : { careReceived: { some: { caregiverId: personId, until: null } } };

/**
 * Борда конекту: нові люди спільноти, яких ще не передали далі. Саме «ще не передали»,
 * а не «колись завели» — інакше за рік команда накопичить видимість пів церкви.
 */
export const boardWhere = (scopes: ViewerScope[]): Prisma.PersonWhereInput | null => {
  const communityIds = ids(scopes, 'communityId');

  return communityIds.length === 0
    ? null
    : {
        communities: { some: { id: { in: communityIds } } },
        careReceived: { some: { origin: CareOrigin.CONNECT, until: null } },
      };
};

/**
 * Головна функція модуля: з ролей і областей рахує, кого видно і кому відкритий
 * пасторський шар. Усе інше в застосунку спирається на її результат.
 */
export const visibilityFor = (viewer: Viewer): Visibility => {
  // Порожній набір ролей — це відсутність прав. Опіка сама по собі доступу не дає:
  // інакше користувач, у якого забрали всі ролі, лишився б з підопічними.
  if (viewer.roles.length === 0) return { rows: NOBODY, pastoral: NOBODY };

  if (isGlobalAdmin(viewer)) return { rows: undefined, pastoral: undefined };

  const care = careWhere(viewer.personId);
  const scope = scopeWhere(viewer.scopes);

  // Адмін з областю бачить її цілком — і командний шар, і пасторський.
  if (has(viewer, Role.ADMIN)) {
    const rows = or(compact([scope, care]));

    return { rows: rows ?? NOBODY, pastoral: rows ?? NOBODY };
  }

  const branches: (Prisma.PersonWhereInput | null)[] = [care];

  if (has(viewer, Role.LEADER)) branches.push(scope);
  // Конект бачить не всю спільноту, а лише свою борду в ній.
  if (has(viewer, Role.CONNECT)) branches.push(boardWhere(viewer.scopes));

  return {
    rows: or(compact(branches)) ?? NOBODY,
    pastoral: care ?? NOBODY,
  };
};

const ids = (scopes: ViewerScope[], key: keyof ViewerScope): string[] =>
  scopes.map((scope) => scope[key]).filter((value): value is string => value !== null);

const compact = <T>(values: (T | null)[]): T[] =>
  values.filter((value): value is T => value !== null);

/** Одна умова лишається собою: зайвий OR лише заважає читати запити в логах. */
const or = (branches: Prisma.PersonWhereInput[]): Prisma.PersonWhereInput | null => {
  if (branches.length === 0) return null;

  return branches.length === 1 ? branches[0] : { OR: branches };
};

/**
 * Які зібрання видно. Загальноцерковні — усім: вони й є спільними. Решта —
 * лише тим, кому довірено відповідну область. Адміну без областей видно все.
 *
 * `undefined` означає «весь календар», як і в решті модуля.
 */
export const gatheringWhere = (viewer: Viewer): Prisma.GatheringWhereInput | undefined => {
  if (viewer.roles.length === 0) return { id: { in: [] } };
  if (isGlobalAdmin(viewer)) return undefined;

  const ids = (key: keyof ViewerScope) =>
    viewer.scopes.map((scope) => scope[key]).filter((value): value is string => value !== null);

  const branches: Prisma.GatheringWhereInput[] = [
    // Загальноцерковне зібрання не має області — його бачать усі.
    { communityId: null, homeGroupId: null, ministryId: null, trainingId: null },
  ];
  const targets: [keyof ViewerScope, keyof Prisma.GatheringWhereInput][] = [
    ['communityId', 'communityId'],
    ['homeGroupId', 'homeGroupId'],
    ['ministryId', 'ministryId'],
    ['trainingId', 'trainingId'],
  ];

  for (const [scopeKey, column] of targets) {
    const scoped = ids(scopeKey);

    if (scoped.length > 0) branches.push({ [column]: { in: scoped } });
  }

  return { OR: branches };
};

/** Складає видимість з фільтром користувача: обидві умови мають виконатись. */
export const narrow = (
  where: Prisma.PersonWhereInput,
  visibility: Prisma.PersonWhereInput | undefined,
): Prisma.PersonWhereInput => (visibility === undefined ? where : { AND: [where, visibility] });
