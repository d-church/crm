import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type PeoplePaginationProps = {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

/**
 * Page numbers around the current one, with ellipses standing in for the rest —
 * 36 pages of people would not fit as a plain list of buttons.
 */
const getPageItems = (page: number, pages: number): (number | 'gap')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

  const around = [page - 1, page, page + 1].filter((value) => value > 1 && value < pages);
  const items: (number | 'gap')[] = [1];

  if (around[0] !== undefined && around[0] > 2) items.push('gap');
  items.push(...around);
  if (around.at(-1) !== undefined && around.at(-1)! < pages - 1) items.push('gap');
  items.push(pages);

  return items;
};

export const PeoplePagination = ({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: PeoplePaginationProps) => {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Сторінки списку"
      className="border-border-muted flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3"
    >
      <span className="text-ink-faint text-xs tabular-nums">
        {from}–{to} з {total}
      </span>

      <div className="flex items-center gap-1">
        <PageButton
          label="Попередня сторінка"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </PageButton>

        {getPageItems(page, pages).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="text-ink-faint px-1 text-xs">
              …
            </span>
          ) : (
            <PageButton
              key={item}
              label={`Сторінка ${item}`}
              isActive={item === page}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ),
        )}

        <PageButton
          label="Наступна сторінка"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-3.5" />
        </PageButton>
      </div>
    </nav>
  );
};

const PageButton = ({
  label,
  isActive,
  disabled,
  onClick,
  children,
}: {
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-current={isActive ? 'page' : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'grid size-7.5 cursor-pointer place-items-center rounded-md border text-[12.5px] tabular-nums transition-colors',
      'disabled:cursor-default disabled:opacity-40',
      isActive
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-input-border bg-card text-ink enabled:hover:border-foreground',
    )}
  >
    {children}
  </button>
);
