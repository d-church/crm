import { PersonStatus } from '@/services';

/** How each relationship stage reads in the UI, and how strongly it is highlighted. */
export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  [PersonStatus.GUEST]: 'Гість',
  [PersonStatus.ATTENDEE]: 'Відвідувач',
  [PersonStatus.MEMBER]: 'Член церкви',
};

export const PERSON_STATUS_VARIANTS: Record<PersonStatus, 'default' | 'secondary' | 'outline'> = {
  [PersonStatus.GUEST]: 'outline',
  [PersonStatus.ATTENDEE]: 'secondary',
  [PersonStatus.MEMBER]: 'default',
};
