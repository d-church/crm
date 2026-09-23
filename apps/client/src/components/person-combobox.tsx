import { Check, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Input, Label } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getPersonName, type PersonChoice } from '@/services';

type PersonComboboxProps = {
  id: string;
  people: PersonChoice[];
  value: string;
  onChange: (value: string) => void;
  /** Підпис над полем. Без нього лишається сама лише коробка з пошуком. */
  label?: string;
  /** Чим поле представляється читачу екрана, коли видимого підпису немає. */
  ariaLabel?: string;
  placeholder?: string;
  /** Як називається порожній вибір — «Не призначено», «Не вказано» тощо. */
  emptyLabel?: string;
  /** Компактні форми задають свою висоту поля. */
  inputClassName?: string;
  error?: string;
  disabled?: boolean;
};

const MAX_RESULTS = 50;

/** Search-first person picker. It avoids mounting a native select with every person. */
export const PersonCombobox = ({
  id,
  people,
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = 'Пошук людини',
  emptyLabel = 'Не призначено',
  inputClassName,
  error,
  disabled,
}: PersonComboboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedPerson = people.find((person) => person.id === value);
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');
  const matches = useMemo(
    () =>
      people
        .filter((person) =>
          getPersonName(person).toLocaleLowerCase('uk-UA').includes(normalizedQuery),
        )
        .slice(0, MAX_RESULTS),
    [normalizedQuery, people],
  );

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  const choose = (personId: string) => {
    onChange(personId);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="grid gap-1.5" ref={containerRef}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <Search className="text-ink-faint pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2" />
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          aria-label={label ? undefined : (ariaLabel ?? placeholder)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={isOpen ? query : selectedPerson ? getPersonName(selectedPerson) : ''}
          placeholder={selectedPerson ? undefined : placeholder}
          disabled={disabled}
          className={cn('pr-10 pl-10', inputClassName)}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsOpen(false);
            }
          }}
        />
        {selectedPerson ? (
          <button
            type="button"
            title="Очистити вибір"
            aria-label="Очистити вибір"
            disabled={disabled}
            className="text-ink-faint hover:text-foreground absolute top-1/2 right-3 z-10 -translate-y-1/2 transition-colors disabled:opacity-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose('')}
          >
            <X className="size-4" />
          </button>
        ) : null}
        {isOpen ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Результати пошуку людини"
            className="bg-popover border-input-border absolute z-30 mt-1 w-full overflow-hidden rounded-md border py-1 shadow-lg"
          >
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className="hover:bg-accent flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] transition-colors"
              onClick={() => choose('')}
            >
              <span className="grid size-4 place-items-center">
                {!value ? <Check className="text-primary size-3.5" /> : null}
              </span>
              {emptyLabel}
            </button>
            <div className="border-border-muted border-t" />
            {normalizedQuery.length === 0 ? (
              <p className="text-ink-faint px-3.5 py-3 text-[12.5px]">
                Введіть ім&apos;я або прізвище
              </p>
            ) : matches.length === 0 ? (
              <p className="text-ink-faint px-3.5 py-3 text-[12.5px]">Нічого не знайдено</p>
            ) : (
              <div className="max-h-64 overflow-y-auto py-1">
                {matches.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected={person.id === value}
                    className={cn(
                      'hover:bg-accent flex w-full items-center gap-2 px-3.5 py-2 text-left text-[13.5px] transition-colors',
                      person.id === value && 'bg-accent',
                    )}
                    onClick={() => choose(person.id)}
                  >
                    <span className="grid size-4 place-items-center">
                      {person.id === value ? <Check className="text-primary size-3.5" /> : null}
                    </span>
                    <span className="truncate">{getPersonName(person)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-[11.5px]">
          {error}
        </p>
      ) : null}
    </div>
  );
};
