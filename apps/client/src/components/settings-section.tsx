import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Рідко потрібне редагування: згорнуте за замовчуванням, щоб не займати місце
 * над тим, заради чого сторінку відкривають. Лишається на самій сторінці —
 * модалок на деталь-сторінках ми не робимо.
 */
export const SettingsSection = ({
  title = 'Налаштування',
  children,
}: {
  title?: string;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left"
      >
        <span className="eyebrow text-muted-foreground">{title}</span>
        <ChevronDown
          className={cn('text-ink-faint size-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen ? <div className="border-border-muted border-t">{children}</div> : null}
    </Card>
  );
};
