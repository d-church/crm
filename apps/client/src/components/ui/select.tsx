import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/** Native select — the design uses the platform control, styled like the inputs. */
export const Select = ({ className, ...props }: ComponentProps<'select'>) => (
  <select
    data-slot="select"
    className={cn(
      'border-input-border bg-input text-foreground cursor-pointer rounded-md border px-3 py-[11px] text-[13.5px] transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
);
