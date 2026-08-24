import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    position="bottom-right"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
      },
    }}
    {...props}
  />
);
