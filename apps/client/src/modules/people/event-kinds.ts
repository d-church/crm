import { PersonEventKind } from '@/services';

/** Спілкування, яке фіксує команда. Подія життя стоїть окремо: у неї своя назва. */
export const TALK_KINDS: PersonEventKind[] = [
  PersonEventKind.CALL,
  PersonEventKind.MEETING,
  PersonEventKind.CONSULTATION,
];

export const EVENT_KIND_LABELS: Record<PersonEventKind, string> = {
  [PersonEventKind.EVENT]: 'Подія',
  [PersonEventKind.CALL]: 'Дзвінок',
  [PersonEventKind.MEETING]: 'Зустріч',
  [PersonEventKind.CONSULTATION]: 'Консультація',
};

export const EVENT_KIND_BADGES: Record<PersonEventKind, string> = {
  [PersonEventKind.EVENT]: 'bg-[#e8e0f0] text-[#5c4a76]',
  [PersonEventKind.CALL]: 'bg-[#dde6f1] text-[#33587a]',
  [PersonEventKind.MEETING]: 'bg-[#dfeadf] text-[#2f6b3d]',
  [PersonEventKind.CONSULTATION]: 'bg-[#f6ecd2] text-[#87682a]',
};
