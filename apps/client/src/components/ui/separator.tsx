import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type SeparatorProps = ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical';
};

export const Separator = ({ className, orientation = 'horizontal', ...props }: SeparatorProps) => (
  <div
    data-slot="separator"
    role="separator"
    aria-orientation={orientation}
    className={cn(
      'bg-border shrink-0',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
);
