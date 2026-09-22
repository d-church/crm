import { HeartHandshake } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ActivityState, type ActivityState as Activity, type MembershipStatus } from '@/services';

import {
  ACTIVITY_BADGES,
  ACTIVITY_HINTS,
  ACTIVITY_LABELS,
  CARE_LABEL,
  MEMBERSHIP_BADGES,
  MEMBERSHIP_HINTS,
  MEMBERSHIP_LABELS,
} from './status';

const BADGE = 'inline-flex w-fit items-center rounded-full px-2.75 py-1 text-[11.5px] leading-none';

export const MembershipBadge = ({
  membership,
  className,
}: {
  membership: MembershipStatus;
  className?: string;
}) => (
  <span
    title={MEMBERSHIP_HINTS[membership]}
    className={cn(BADGE, MEMBERSHIP_BADGES[membership], className)}
  >
    {MEMBERSHIP_LABELS[membership]}
  </span>
);

/** «Активний» — стан за замовчуванням, тож у списку його не показуємо. */
export const ActivityBadge = ({
  activity,
  className,
  showWhenActive = false,
}: {
  activity: Activity;
  className?: string;
  showWhenActive?: boolean;
}) => {
  if (activity === ActivityState.ACTIVE && !showWhenActive) return null;

  return (
    <span
      title={ACTIVITY_HINTS[activity]}
      className={cn(BADGE, ACTIVITY_BADGES[activity], className)}
    >
      {ACTIVITY_LABELS[activity]}
    </span>
  );
};

export const CareBadge = ({ className }: { className?: string }) => (
  <span
    title="Команда домовилась приділити цій людині окрему увагу"
    className={cn(BADGE, 'gap-1 bg-[#f5dcd6] text-[#9a4030]', className)}
  >
    <HeartHandshake className="size-3" />
    {CARE_LABEL}
  </span>
);
