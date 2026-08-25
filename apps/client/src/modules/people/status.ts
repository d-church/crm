import { PersonStatus } from '@/services';

/** Chip order on the people screen, mirroring the design canvas. */
export const PERSON_STATUSES: PersonStatus[] = [
  PersonStatus.MEMBER,
  PersonStatus.SERVANT,
  PersonStatus.NEW,
  PersonStatus.GUEST,
  PersonStatus.INACTIVE,
];

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  [PersonStatus.MEMBER]: 'Член',
  [PersonStatus.SERVANT]: 'Служитель',
  [PersonStatus.NEW]: 'Новий',
  [PersonStatus.GUEST]: 'Гість',
  [PersonStatus.INACTIVE]: 'Неактивний',
};

/** Badge fills straight from the design — only the serving status is solid. */
export const PERSON_STATUS_BADGES: Record<PersonStatus, string> = {
  [PersonStatus.MEMBER]: 'bg-[#e3ece4] text-[#2b5c4a]',
  [PersonStatus.SERVANT]: 'bg-[#2b5c4a] text-[#fffdf8]',
  [PersonStatus.NEW]: 'bg-[#f5ead3] text-[#8a6a2a]',
  [PersonStatus.GUEST]: 'bg-[#efece3] text-[#6f6c62]',
  [PersonStatus.INACTIVE]: 'bg-[#f4f2ec] text-[#a29a8c]',
};
