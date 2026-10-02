import { Check, Search, X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

/** Відступ між полем і списком. */
const GAP = 4;
/** Менше місця під полем — відкриваємось угору. */
const COMFORTABLE_HEIGHT = 220;
const MIN_HEIGHT = 140;
const MAX_HEIGHT = 340;
/** Вузьке поле в колонці картки не має обрізати імена в списку. */
const MIN_WIDTH = 240;

/** Де показати список. Рахується від поля у координатах вікна, бо список у body. */
type Placement = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
};

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
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [placement, setPlacement] = useState<Placement | null>(null);
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
      const target = event.target as Node;

      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

  /**
   * Список живе в `body`, а не в потоці форми: секції картки й діалоги обрізають
   * усе, що виходить за їхні межі, і відкритий список ховався б за краєм картки.
   * Тому позицію рахуємо від поля й оновлюємо, поки список відкритий.
   */
  useLayoutEffect(() => {
    // Закритий список нічого не малює, тож торішню позицію не прибираємо:
    // на наступному відкритті її перерахує цей же ефект — до того, як браузер
    // устигне намалювати кадр.
    if (!isOpen) return;

    const place = () => {
      const field = fieldRef.current;

      if (!field) return;

      const rect = field.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - GAP * 2;
      const above = rect.top - GAP * 2;
      const dropsUp = below < COMFORTABLE_HEIGHT && above > below;
      const space = dropsUp ? above : below;

      const width = Math.min(Math.max(rect.width, MIN_WIDTH), window.innerWidth - GAP * 2);

      setPlacement({
        // Ширший за поле список тримаємо в межах вікна, а не за правим краєм.
        left: Math.max(GAP, Math.min(rect.left, window.innerWidth - width - GAP)),
        width,
        ...(dropsUp ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
        maxHeight: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, space)),
      });
    };

    place();
    // Із захопленням: прокрутитися може будь-який предок, не лише вікно.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);

    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [isOpen]);

  const choose = (personId: string) => {
    onChange(personId);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="grid gap-1.5" ref={containerRef}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative" ref={fieldRef}>
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
        {isOpen && placement
          ? createPortal(
              <div
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label="Результати пошуку людини"
                style={{
                  left: placement.left,
                  width: placement.width,
                  top: placement.top,
                  bottom: placement.bottom,
                  maxHeight: placement.maxHeight,
                }}
                // Для діалогу клік у body — клік «зовні», і вибір людини закривав би
                // сам діалог. Подія далі не йде, тож діалог її не бачить.
                onPointerDown={(event) => event.stopPropagation()}
                // `pointer-events-auto` обовʼязковий: поки відкритий діалог, Radix
                // гасить вказівник на всьому `body`, а список висить саме там —
                // без цього він видимий, але не клікається взагалі.
                className="bg-popover border-input-border pointer-events-auto fixed z-60 flex flex-col overflow-hidden rounded-md border py-1 shadow-lg"
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
                  <div className="min-h-0 flex-1 overflow-y-auto py-1">
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
              </div>,
              document.body,
            )
          : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-[11.5px]">
          {error}
        </p>
      ) : null}
    </div>
  );
};
