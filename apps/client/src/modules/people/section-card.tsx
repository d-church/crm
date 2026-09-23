import type { ReactNode } from 'react';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

/** Спільна оболонка секцій картки: тонкий заголовок, дія праворуч, щільний вміст. */
export const SectionCard = ({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <Card className={cn('overflow-hidden', className)}>
    <div className="border-border-muted flex items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-3.5 sm:py-2">
      <span className="eyebrow text-muted-foreground">{title}</span>
      {action}
    </div>
    <div className="px-4 py-3 sm:px-3.5 sm:py-2.5">{children}</div>
  </Card>
);
