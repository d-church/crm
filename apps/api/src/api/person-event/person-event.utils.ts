import { PersonEventKind } from '@generated/prisma/client';

const KIND_LABELS: Record<PersonEventKind, string> = {
  EVENT: 'Подія',
  CALL: 'Дзвінок',
  MEETING: 'Зустріч',
  CONSULTATION: 'Консультація',
};

type Describable = {
  kind: PersonEventKind;
  title: string | null;
  withPerson?: { firstName: string; lastName: string | null } | null;
};

/**
 * Як запис називається в журналі й хронології: подія життя — своєю назвою,
 * спілкування — видом і тим, з ким воно було.
 */
export const describeEvent = ({ kind, title, withPerson }: Describable): string => {
  if (kind === PersonEventKind.EVENT) return title ?? 'Подія';

  // Тире, а не «з»: відмінювати імена ми не вміємо, а «з Андрій» читається погано.
  const who = withPerson
    ? ` — ${[withPerson.firstName, withPerson.lastName].filter(Boolean).join(' ')}`
    : '';

  return `${KIND_LABELS[kind]}${who}`;
};
