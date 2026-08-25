import { cn } from '@/lib/utils';
import type { PersonStatus } from '@/services';

import { PERSON_STATUS_BADGES, PERSON_STATUS_LABELS } from './status';

export const PersonStatusBadge = ({
  status,
  className,
}: {
  status: PersonStatus;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex w-fit items-center rounded-full px-2.75 py-1 text-[11.5px] leading-none',
      PERSON_STATUS_BADGES[status],
      className,
    )}
  >
    {PERSON_STATUS_LABELS[status]}
  </span>
);
