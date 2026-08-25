import { FollowUpState, PersonStatus } from '@/services';

/** Pipeline order the church uses, from first visit to falling away. */
export const PERSON_STATUSES: PersonStatus[] = [
  PersonStatus.NEW,
  PersonStatus.CONNECTED,
  PersonStatus.NEXT_STEP,
  PersonStatus.COMMUNITY,
  PersonStatus.SERVING,
  PersonStatus.CARE,
  PersonStatus.INACTIVE,
];

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  [PersonStatus.NEW]: 'Новий',
  [PersonStatus.CONNECTED]: 'Є контакт',
  [PersonStatus.NEXT_STEP]: 'Наступний крок',
  [PersonStatus.COMMUNITY]: 'У спільноті',
  [PersonStatus.SERVING]: 'Служить',
  [PersonStatus.CARE]: 'Потребує опіки',
  [PersonStatus.INACTIVE]: 'Неактивний',
};

/** The church's own gloss for each stage — shown as a tooltip and on the card. */
export const PERSON_STATUS_HINTS: Record<PersonStatus, string> = {
  [PersonStatus.NEW]: 'перший візит',
  [PersonStatus.CONNECTED]: 'є контакт',
  [PersonStatus.NEXT_STEP]: 'проходить наступний крок',
  [PersonStatus.COMMUNITY]: 'включений у спільноту',
  [PersonStatus.SERVING]: 'служить',
  [PersonStatus.CARE]: 'потребує пасторської опіки',
  [PersonStatus.INACTIVE]: 'перестав приходити',
};

/**
 * Hues follow the church's colour key (🟢🔵🟡🟣🟠🔴⚫), toned down to sit on the
 * warm paper background instead of shouting off it.
 */
export const PERSON_STATUS_BADGES: Record<PersonStatus, string> = {
  [PersonStatus.NEW]: 'bg-[#dfeadf] text-[#2f6b3d]',
  [PersonStatus.CONNECTED]: 'bg-[#dde6f1] text-[#33587a]',
  [PersonStatus.NEXT_STEP]: 'bg-[#f6ecd2] text-[#87682a]',
  [PersonStatus.COMMUNITY]: 'bg-[#e8e0f0] text-[#5c4a76]',
  [PersonStatus.SERVING]: 'bg-[#f7e2cf] text-[#8c5423]',
  [PersonStatus.CARE]: 'bg-[#f5dcd6] text-[#9a4030]',
  [PersonStatus.INACTIVE]: 'bg-[#e6e3dc] text-[#5b584f]',
};

/** Matching dot for the sidebar-free contexts where a full badge is too loud. */
export const PERSON_STATUS_DOTS: Record<PersonStatus, string> = {
  [PersonStatus.NEW]: 'bg-[#4a9a5c]',
  [PersonStatus.CONNECTED]: 'bg-[#3f74a8]',
  [PersonStatus.NEXT_STEP]: 'bg-[#d7ab3c]',
  [PersonStatus.COMMUNITY]: 'bg-[#8a6bb1]',
  [PersonStatus.SERVING]: 'bg-[#d2803a]',
  [PersonStatus.CARE]: 'bg-[#c04a36]',
  [PersonStatus.INACTIVE]: 'bg-[#3b3c35]',
};

export const FOLLOW_UP_STATES: FollowUpState[] = [
  FollowUpState.NOT_DONE,
  FollowUpState.PLANNED,
  FollowUpState.DONE,
];

export const FOLLOW_UP_LABELS: Record<FollowUpState, string> = {
  [FollowUpState.NOT_DONE]: 'не зроблено',
  [FollowUpState.PLANNED]: 'заплановано',
  [FollowUpState.DONE]: 'зроблено',
};
