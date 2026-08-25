import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export const Input = ({ className, type, ...props }: ComponentProps<'input'>) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      'border-input-border bg-input text-foreground flex w-full min-w-0 rounded-md border px-3.5 py-[11px] text-[13.5px] transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'aria-invalid:border-destructive',
      className,
    )}
    {...props}
  />
);
