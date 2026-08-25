import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="flex flex-wrap items-end justify-between gap-6">
    <div className="flex flex-col gap-1.5">
      {eyebrow ? <span className="eyebrow text-muted-foreground">{eyebrow}</span> : null}
      <h1 className="text-[32px] leading-none font-light tracking-[-0.01em]">{title}</h1>
      {description ? <p className="text-ink-faint text-[13px]">{description}</p> : null}
    </div>

    {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
  </header>
);
