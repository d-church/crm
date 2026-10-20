import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui';
import type { Slice } from '@/services';

/** Спільна оболонка блоку: заголовок, підпис і вміст у картці. */
export const StatCard = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <section className="bg-card border-border-muted rounded-xl border">
    <div className="border-border-muted flex items-baseline justify-between gap-3 border-b px-4 py-2.5">
      <span className="eyebrow text-muted-foreground">{title}</span>
      {hint ? <span className="text-ink-faint text-[11.5px]">{hint}</span> : null}
    </div>
    <div className="px-4 py-3.5">{children}</div>
  </section>
);

/** Велике число з підписом — коли показувати треба одну величину, а не розподіл. */
export const BigNumber = ({
  value,
  unit,
  note,
}: {
  value: string | number;
  unit?: string;
  note?: string;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[34px] leading-none font-light tabular-nums">
      {value}
      {unit ? <span className="text-ink-faint ml-1.5 text-[15px]">{unit}</span> : null}
    </span>
    {note ? <span className="text-ink-faint text-[11.5px]">{note}</span> : null}
  </div>
);

/**
 * Розподіл смужками. Частку показуємо від найбільшої групи, а не від усіх:
 * інакше при одній переважній групі решта злипається в невидимі риски.
 */
export const Bars = ({ slices }: { slices: Slice[] }) => {
  const total = slices.reduce((sum, { value }) => sum + value, 0);
  const peak = Math.max(...slices.map(({ value }) => value), 1);

  if (total === 0) return <p className="text-ink-faint text-[12.5px]">Немає даних</p>;

  return (
    <ul className="grid gap-2">
      {slices.map(({ label, value }) => (
        <li
          key={label}
          className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3"
        >
          <span className="text-ink-faint truncate text-[12px]">{label}</span>
          <span className="bg-accent h-2 overflow-hidden rounded-full">
            <span
              className="bg-primary block h-full rounded-full"
              style={{ width: `${(value / peak) * 100}%` }}
            />
          </span>
          <span className="text-[12.5px] tabular-nums">
            {value}
            <span className="text-ink-faint ml-1.5">{share(value, total)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
};

/** Частка від бази з самою базою поруч: відсоток без знаменника легко читати неправильно. */
export const Share = ({ label, value, of }: { label: string; value: number; of: number }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <span className="text-[13px]">{label}</span>
    <span className="text-[13px] tabular-nums">
      {value}
      <span className="text-ink-faint ml-1.5 text-[11.5px]">
        з {of} · {share(value, of)}
      </span>
    </span>
  </div>
);

export const StatSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    {Array.from({ length: 4 }, (_, index) => (
      <Skeleton key={index} className="h-44" />
    ))}
  </div>
);

const share = (value: number, total: number): string =>
  total === 0 ? '—' : `${Math.round((value / total) * 100)}%`;
