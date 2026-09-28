import { MaritalStatus, OrphanStatus, PersonGender, type Person } from '@/services';

/**
 * Обставини, які церква памʼятає про людину. Частина підписів залежить від статі,
 * тому це функції, а не константи: «вдова» й «вдівець» — одне значення в базі.
 */
export const ORPHAN_LABELS: Record<OrphanStatus, string> = {
  FULL: 'Сирота',
  HALF: 'Напівсирота',
};

export const ORPHAN_STATUSES: OrphanStatus[] = [OrphanStatus.FULL, OrphanStatus.HALF];

export const MARITAL_STATUSES: MaritalStatus[] = [
  MaritalStatus.SINGLE,
  MaritalStatus.ENGAGED,
  MaritalStatus.MARRIED,
  MaritalStatus.DIVORCED,
  MaritalStatus.WIDOWED,
];

type Gender = Person['gender'];

const byGender = (gender: Gender, female: string, male: string) =>
  gender === PersonGender.FEMALE ? female : male;

export const maritalLabel = (status: MaritalStatus, gender: Gender): string =>
  ({
    SINGLE: byGender(gender, 'Незаміжня', 'Неодружений'),
    ENGAGED: byGender(gender, 'Заручена', 'Заручений'),
    MARRIED: byGender(gender, 'Заміжня', 'Одружений'),
    DIVORCED: byGender(gender, 'Розлучена', 'Розлучений'),
    WIDOWED: byGender(gender, 'Вдова', 'Вдівець'),
  })[status];

export const militaryLabel = (gender: Gender) => byGender(gender, 'Військова', 'Військовий');

/** Пара є лише в заручених і одружених: для решти станів поле не має сенсу. */
export const hasPartner = (status: MaritalStatus | null | undefined) =>
  status === MaritalStatus.ENGAGED || status === MaritalStatus.MARRIED;

/** Що означає дата: заручини чи одруження. */
export const maritalDateLabel = (status: MaritalStatus | null | undefined) =>
  status === MaritalStatus.ENGAGED ? 'Заручини' : 'Одруження';

/** Пару вносять на одній картці, а показувати треба на обох. */
export const partnerOf = (person: Person) => person.partner ?? person.partnerOf ?? null;
