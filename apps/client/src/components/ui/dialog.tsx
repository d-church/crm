import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-[#23241f]/40 backdrop-blur-[2px]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
      )}
    />

    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        'bg-card border-border fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border p-6 shadow-xl',
        'max-h-[calc(100svh-2rem)] overflow-y-auto',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95',
        className,
      )}
      {...props}
    >
      {children}

      <DialogPrimitive.Close
        className="text-ink-faint hover:text-foreground absolute top-5 right-5 transition-colors"
        aria-label="Закрити"
      >
        <X className="size-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    data-slot="dialog-footer"
    className={cn('flex flex-wrap items-center justify-end gap-2', className)}
    {...props}
  />
);

export const DialogTitle = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn('text-xl font-light tracking-[-0.01em]', className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn('text-ink-faint text-[13px]', className)}
    {...props}
  />
);
