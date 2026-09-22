import { ActivityState, FollowUpState, MembershipStatus } from '@/services';

/**
 * Три різні питання про людину, які раніше відповідались одним полем:
 * ким вона є для церкви (статус), чи вона зараз тут (активність)
 * і чи потребує уваги (окремий прапорець).
 */
export const MEMBERSHIP_STATUSES: MembershipStatus[] = [
  MembershipStatus.SUBSCRIBER,
  MembershipStatus.GUEST,
  MembershipStatus.ATTENDER,
  MembershipStatus.MEMBER,
  MembershipStatus.FORMER_MEMBER,
];

export const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  [MembershipStatus.SUBSCRIBER]: 'Підписник',
  [MembershipStatus.GUEST]: 'Гість',
  [MembershipStatus.ATTENDER]: 'Прихожанин',
  [MembershipStatus.MEMBER]: 'Член церкви',
  [MembershipStatus.FORMER_MEMBER]: 'Колишній член',
};

/** Пояснення, яке видно підказкою на бейджі й у випадному списку. */
export const MEMBERSHIP_HINTS: Record<MembershipStatus, string> = {
  [MembershipStatus.SUBSCRIBER]: 'стежить за церквою, але не приходить',
  [MembershipStatus.GUEST]: 'був у гостях',
  [MembershipStatus.ATTENDER]: 'ходить, але не член церкви',
  [MembershipStatus.MEMBER]: 'прийнятий у члени церкви',
  [MembershipStatus.FORMER_MEMBER]: 'вибув з членства',
};

/** Сходинка вище — тепліший колір; той, хто вибув, тьмяніє. */
export const MEMBERSHIP_BADGES: Record<MembershipStatus, string> = {
  [MembershipStatus.SUBSCRIBER]: 'bg-[#e6e3dc] text-[#5b584f]',
  [MembershipStatus.GUEST]: 'bg-[#dfeadf] text-[#2f6b3d]',
  [MembershipStatus.ATTENDER]: 'bg-[#dde6f1] text-[#33587a]',
  [MembershipStatus.MEMBER]: 'bg-[#e8e0f0] text-[#5c4a76]',
  [MembershipStatus.FORMER_MEMBER]: 'bg-[#eae7e0] text-[#8a867c]',
};

export const ACTIVITY_STATES: ActivityState[] = [
  ActivityState.ACTIVE,
  ActivityState.ABROAD,
  ActivityState.INACTIVE,
  ActivityState.MOVED,
];

export const ACTIVITY_LABELS: Record<ActivityState, string> = {
  [ActivityState.ACTIVE]: 'Активний',
  [ActivityState.ABROAD]: 'За кордоном',
  [ActivityState.INACTIVE]: 'Неактивний',
  [ActivityState.MOVED]: 'Переїхав',
};

export const ACTIVITY_HINTS: Record<ActivityState, string> = {
  [ActivityState.ACTIVE]: 'буває на зібраннях',
  [ActivityState.ABROAD]: 'зараз за межами країни',
  [ActivityState.INACTIVE]: 'давно не з’являвся',
  [ActivityState.MOVED]: 'переїхав до іншої церкви або міста',
};

export const ACTIVITY_BADGES: Record<ActivityState, string> = {
  [ActivityState.ACTIVE]: 'bg-[#dfeadf] text-[#2f6b3d]',
  [ActivityState.ABROAD]: 'bg-[#dce9e6] text-[#2f675e]',
  [ActivityState.INACTIVE]: 'bg-[#e6e3dc] text-[#5b584f]',
  [ActivityState.MOVED]: 'bg-[#f7e2cf] text-[#8c5423]',
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

export const CARE_LABEL = 'Потребує уваги';
