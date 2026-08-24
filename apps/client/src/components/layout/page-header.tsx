import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="grid gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>

    {actions}
  </div>
);
