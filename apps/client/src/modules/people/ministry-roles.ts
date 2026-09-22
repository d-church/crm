import { MinistryRole } from '@/services';

/** Від простішої участі до відповідальності за служіння. */
export const MINISTRY_ROLES: MinistryRole[] = [
  MinistryRole.MEMBER,
  MinistryRole.HELPER,
  MinistryRole.LEADER,
];

export const MINISTRY_ROLE_LABELS: Record<MinistryRole, string> = {
  [MinistryRole.MEMBER]: 'Учасник',
  [MinistryRole.HELPER]: 'Помічник',
  [MinistryRole.LEADER]: 'Керівник',
};

/** Керівника видно одразу, помічника трохи менше, учасник не привертає уваги. */
export const MINISTRY_ROLE_BADGES: Record<MinistryRole, string> = {
  [MinistryRole.MEMBER]: 'bg-[#eae7e0] text-[#6f6c62]',
  [MinistryRole.HELPER]: 'bg-[#dde6f1] text-[#33587a]',
  [MinistryRole.LEADER]: 'bg-[#f7e2cf] text-[#8c5423]',
};
