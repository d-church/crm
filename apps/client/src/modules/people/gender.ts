import { PersonGender } from '@/services';

export const PERSON_GENDERS = [PersonGender.MALE, PersonGender.FEMALE] as const;

export const PERSON_GENDER_LABELS: Record<PersonGender, string> = {
  [PersonGender.MALE]: 'Чоловік',
  [PersonGender.FEMALE]: 'Жінка',
};
