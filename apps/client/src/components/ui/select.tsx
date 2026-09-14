import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Native select — the design uses the platform control, styled like the inputs. */
export const Select = ({ className, ...props }: ComponentProps<'select'>) => (
  <select
    data-slot="select"
    className={cn(
      'border-input-border bg-input text-foreground h-11 cursor-pointer rounded-md border px-3 py-0 text-[13.5px] leading-normal transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
);
