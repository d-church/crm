import { PERSON_GENDER_LABELS } from './gender';
import { ACTIVITY_LABELS, FOLLOW_UP_LABELS, MEMBERSHIP_LABELS } from './status';

export { ACTIVITY_LABELS, FOLLOW_UP_LABELS, MEMBERSHIP_LABELS };

/** Підписи статі за сирим значенням із журналу. */
export const PERSON_GENDER_LABELS_BY_VALUE: Record<string, string | undefined> =
  PERSON_GENDER_LABELS;
