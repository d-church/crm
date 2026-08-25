import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea
    data-slot="textarea"
    className={cn(
      'border-input-border bg-input text-foreground field-sizing-content min-h-20 w-full rounded-md border px-3.5 py-2.5 text-[13.5px]',
      className,
    )}
    {...props}
  />
);
