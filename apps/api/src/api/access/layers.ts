/**
 * Шари картки. Рядкова фільтрація каже, кого видно; шари кажуть, що саме з картки
 * віддавати. Без другого перше не рятує: лідер служіння бачить свого музиканта —
 * і разом з ним його пасторські нотатки, якщо картка їде цілком.
 *
 * Список полів навмисно білий, а не чорний: нове поле за замовчуванням закрите,
 * і щоб його показати, треба свідомо вписати його в шар.
 */

/** Імʼя й належність: те, що лідер бачить по будь-кому в церкві. */
const STRUCTURE_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'gender',
  'membership',
  'activity',
  'baptizedAt',
  'memberSince',
  'leftAt',
  'homeGroupId',
  'homeGroupRole',
  'createdAt',
  'updatedAt',
] as const;

/** Те, що потрібно, щоб вести команду: навантаження, відвідуваність, звʼязок. */
const TEAM_FIELDS = [...STRUCTURE_FIELDS, 'phone', 'city', 'birthDate', 'birthMd'] as const;

/**
 * Дані реєстру: як з людиною звʼязатися, коли прийшла, коли хрестилась. Їх веде
 * адміністратор, і для цього не треба знати, що з людиною відбувається — саме
 * тому вони окремо від пасторського шару, а не всередині нього.
 */
const REGISTRY_FIELDS = [
  ...TEAM_FIELDS,
  'email',
  'address',
  'postalCode',
  'district',
  'region',
  'homePhone',
  'workPhone',
  'firstVisitAt',
  'connectedBy',
] as const;

/** Звʼязки, які лишаються на командному шарі. Решта — пасторські. */
const TEAM_RELATIONS = [
  'communities',
  'homeGroup',
  'churchRoles',
  'ministryAssignments',
  'trainings',
  // Лідерство — це теж структура: кого людина веде, видно кожному, хто її бачить.
  'leadingCommunities',
  'leadingHomeGroups',
  'leadingTrainings',
] as const;

const TEAM_KEYS: ReadonlySet<string> = new Set<string>([...TEAM_FIELDS, ...TEAM_RELATIONS]);
const REGISTRY_KEYS: ReadonlySet<string> = new Set<string>([...REGISTRY_FIELDS, ...TEAM_RELATIONS]);

/** Шари вкладені: кожен наступний містить попередній. */
export type PersonLayer = 'team' | 'registry' | 'pastoral';

/** Що картка про себе повідомляє: який шар відкритий тому, хто її отримав. */
export type PersonAccess = { pastoral: boolean };

/**
 * Обрізає картку до дозволеного шару й підписує її тим, що віддано.
 *
 * Підпис потрібен клієнту: без нього картка без нотаток і кроків нічим не
 * відрізняється від картки, де їх просто немає, і інтерфейс мовчки показав би
 * «порожньо» замість «вам це закрито».
 */
export const applyLayer = <T extends { id: string }>(
  person: T,
  layer: PersonLayer,
): T & { access: PersonAccess } => {
  if (layer === 'pastoral') return { ...person, access: { pastoral: true } };

  const allowed = layer === 'registry' ? REGISTRY_KEYS : TEAM_KEYS;
  const visible: Record<string, unknown> = { access: { pastoral: false } };

  for (const [key, value] of Object.entries(person)) {
    if (allowed.has(key)) visible[key] = value;
  }

  return visible as T & { access: PersonAccess };
};
