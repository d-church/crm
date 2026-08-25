import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card"
    className={cn('bg-card text-card-foreground border-border rounded-xl border', className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="card-title" className={cn('text-base', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="card-description"
    className={cn('text-ink-faint text-[13px]', className)}
    {...props}
  />
);

export const CardContent = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="card-content" className={cn('p-5 pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="card-footer" className={cn('flex items-center p-5 pt-0', className)} {...props} />
);
