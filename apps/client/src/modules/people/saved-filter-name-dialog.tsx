import { useState, type FormEvent } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
} from '@/components/ui';

import { MAX_SAVED_FILTER_NAME } from './saved-filters';

type SavedFilterNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialName?: string;
  submitLabel: string;
  /** Returns why the name cannot be used, or `null`. */
  validate: (name: string) => string | null;
  onSubmit: (name: string) => void;
};

/** Asks for a name when a filter set is saved or renamed. */
export const SavedFilterNameDialog = ({
  open,
  onOpenChange,
  ...props
}: SavedFilterNameDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      {/* Mounted only while open, so the name starts fresh every time. */}
      <NameForm {...props} onDone={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);

type NameFormProps = Omit<SavedFilterNameDialogProps, 'open' | 'onOpenChange'> & {
  onDone: () => void;
};

const NameForm = ({
  title,
  description,
  initialName = '',
  submitLabel,
  validate,
  onSubmit,
  onDone,
}: NameFormProps) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const problem = validate(name);

    if (problem) {
      setError(problem);
      return;
    }

    onSubmit(name.trim());
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogHeader className="pr-8">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <Field
        id="saved-filter-name"
        label="Назва"
        value={name}
        maxLength={MAX_SAVED_FILTER_NAME}
        placeholder="Напр., Нові без домашньої групи"
        autoFocus
        error={error ?? undefined}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Скасувати
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
};
