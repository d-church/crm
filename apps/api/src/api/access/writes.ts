import { ForbiddenException } from '@nestjs/common';

import { Role } from '@generated/prisma/client';

import type { Viewer } from './visibility';

/**
 * Що кому можна міняти. Рядкового доступу тут мало: лідер домашньої групи бачить
 * свого учасника — і цього досить, щоб перенести його в чужу групу, якщо не спитати
 * окремо. Тому запис перевіряється за полем, а не лише за людиною.
 */

/**
 * Структурні поля: вони кажуть, де людина перебуває в церкві. Міняє їх адмін —
 * «додати в домашню групу чи служіння» не в руках лідера.
 */
const STRUCTURAL_FIELDS = ['communityIds', 'homeGroupId', 'ministries', 'trainingIds'] as const;

/**
 * Поля пасторського шару: щоб їх міняти, потрібна опіка, а не участь у команді.
 * Статус і активність теж тут — це висновок про людину, а не про її команду.
 */
const PASTORAL_FIELDS = [
  'notes',
  'careNeeded',
  'orphanStatus',
  'isMilitary',
  'maritalStatus',
  'partnerId',
  'maritalSince',
  'followUp',
  'membership',
  'activity',
  'email',
  'address',
  'postalCode',
  'district',
  'region',
  'homePhone',
  'workPhone',
  'firstVisitAt',
  'connectedBy',
  'responsible',
  'baptizedAt',
  'memberSince',
  'leftAt',
] as const;

/** Масові дії, які переставляють людину в структурі церкви. */
const STRUCTURAL_ACTIONS = ['community', 'homeGroup', 'ministry', 'training'] as const;

export const isAdmin = (viewer: Viewer): boolean =>
  viewer.roles.includes(Role.SUPERADMIN) || viewer.roles.includes(Role.ADMIN);

const listed = (fields: readonly string[], keys: string[]) =>
  keys.filter((key) => fields.includes(key));

/**
 * Які перевірки потрібні для цієї правки. Повертає рішення, а не кидає виняток:
 * так його видно в тестах і не треба піднімати базу, щоб перевірити правило.
 */
export const writeRequirements = (
  viewer: Viewer,
  payload: object,
): { structural: string[]; pastoral: string[] } => {
  const keys = Object.entries(payload)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);

  return {
    structural: isAdmin(viewer) ? [] : listed(STRUCTURAL_FIELDS, keys),
    pastoral: isAdmin(viewer) ? [] : listed(PASTORAL_FIELDS, keys),
  };
};

/** Структурні поля лідеру недоступні взагалі — тут і перевіряти нічого по людині. */
export const assertStructuralAllowed = (viewer: Viewer, payload: object): void => {
  const { structural } = writeRequirements(viewer, payload);

  if (structural.length > 0) {
    throw new ForbiddenException(
      `Переставляти людину в структурі церкви може адміністратор (${structural.join(', ')})`,
    );
  }
};

/** Те саме для масової дії: вона робить рівно те, що й правка картки, але списком. */
export const assertBulkActionAllowed = (viewer: Viewer, action: string): void => {
  if (!isAdmin(viewer) && (STRUCTURAL_ACTIONS as readonly string[]).includes(action)) {
    throw new ForbiddenException('Переставляти людей у структурі церкви може адміністратор');
  }
};

/** Чи правка чіпає пасторський шар — тоді потрібна опіка над цією людиною. */
export const touchesPastoral = (viewer: Viewer, payload: object): boolean =>
  writeRequirements(viewer, payload).pastoral.length > 0;

/** Масові дії пасторського шару: решта (structural) вже відсіяна окремо. */
export const bulkTouchesPastoral = (viewer: Viewer, action: string): boolean =>
  !isAdmin(viewer) && !(STRUCTURAL_ACTIONS as readonly string[]).includes(action);
