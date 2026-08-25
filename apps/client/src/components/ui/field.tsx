import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';
import { Label } from './label';

type FieldProps = ComponentProps<typeof Input> & {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  containerClassName?: string;
};

/** Label + input + validation message, wired for react-hook-form registration. */
export const Field = ({
  label,
  error,
  hint,
  id,
  name,
  containerClassName,
  ...props
}: FieldProps) => {
  const fieldId = id ?? name;

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>

      <Input
        id={fieldId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />

      {error ? (
        <p id={`${fieldId}-error`} className="text-destructive text-[11.5px]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-ink-faint text-[11.5px]">{hint}</p>
      ) : null}
    </div>
  );
};
