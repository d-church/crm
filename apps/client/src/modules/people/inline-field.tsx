import { Check, Copy, Pencil } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Input, Select, Textarea } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

export type InlineFieldType = 'text' | 'date' | 'select' | 'textarea' | 'phone' | 'email';

export type InlineFieldOption = { value: string; label: string };

type InlineFieldProps = {
  label: string;
  /** Порожній рядок означає «не заповнено». */
  value: string;
  type?: InlineFieldType;
  options?: InlineFieldOption[];
  placeholder?: string;
  /** Текст під значенням: вік біля дати народження, підказка до статусу. */
  hint?: string;
  maxLength?: number;
  /** Одразу відкрити в режимі редагування — коли поле щойно додали через меню. */
  autoEdit?: boolean;
  /** Нотатки не потребують підпису: секція вже називається «Нотатки». */
  labelHidden?: boolean;
  onSave: (value: string) => Promise<unknown>;
  onCancelEmpty?: () => void;
};

/**
 * Значення читається як текст, а клік перетворює його на поле. Так картка
 * виглядає як довідка про людину, а не як форма на тридцять інпутів.
 */
export const InlineField = ({
  label,
  value,
  type = 'text',
  options,
  placeholder,
  hint,
  maxLength,
  autoEdit = false,
  labelHidden = false,
  onSave,
  onCancelEmpty,
}: InlineFieldProps) => {
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const controlRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) controlRef.current?.focus();
  }, [isEditing]);

  // Чернетка живе лише під час редагування, тож беремо значення саме на вході.
  const startEditing = () => {
    setDraft(value);
    setIsEditing(true);
  };

  const stop = () => {
    setIsEditing(false);
    if (!value && !draft) onCancelEmpty?.();
  };

  // Поле, яке щойно відкрили з меню, не закриваємо від blur, що прилетів
  // одразу після монтування: це не дія користувача, а повернення фокуса.
  const isSettlingRef = useRef(autoEdit);

  useEffect(() => {
    if (!autoEdit) return;

    const timer = setTimeout(() => (isSettlingRef.current = false), 300);

    return () => clearTimeout(timer);
  }, [autoEdit]);

  const save = async () => {
    if (draft === value) {
      stop();
      return;
    }

    setIsSaving(true);

    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Не вдалося зберегти «${label}»`));
      controlRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value);
      stop();
    }

    // У багаторядковому полі Enter — це новий рядок, зберігає Ctrl/Cmd+Enter.
    if (event.key === 'Enter' && (type !== 'textarea' || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void save();
    }
  };

  if (isEditing) {
    const shared = {
      ref: controlRef as never,
      value: draft,
      disabled: isSaving,
      'aria-label': label,
      onKeyDown,
      onBlur: () => {
        if (isSettlingRef.current) {
          controlRef.current?.focus();
          return;
        }

        void save();
      },
      onChange: (event: { target: { value: string } }) => setDraft(event.target.value),
    };

    return (
      <Row label={label} labelHidden={labelHidden}>
        <div className="flex items-start gap-1">
          {type === 'select' ? (
            <Select {...shared} className="h-10 w-full text-[14px] sm:h-9 sm:text-[13px]">
              <option value="">—</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : type === 'textarea' ? (
            <Textarea
              {...shared}
              rows={5}
              maxLength={maxLength}
              className="text-[14px] sm:text-[12.5px]"
            />
          ) : (
            <Input
              {...shared}
              type={type === 'date' ? 'date' : type === 'email' ? 'email' : 'text'}
              inputMode={type === 'phone' ? 'tel' : undefined}
              maxLength={maxLength}
              placeholder={placeholder}
              className="h-10 text-[14px] sm:h-9 sm:text-[13px]"
            />
          )}

          {/* Кнопка потрібна для тих, хто клікає мишею повз поле. */}
          <button
            type="button"
            aria-label="Зберегти"
            className="text-primary hover:text-primary-hover grid size-9 shrink-0 cursor-pointer place-items-center"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void save()}
          >
            <Check className="size-4" />
          </button>
        </div>
      </Row>
    );
  }

  return (
    <Row label={label} labelHidden={labelHidden}>
      <div className="group flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={startEditing}
          className={cn(
            'min-w-0 cursor-text rounded px-1 py-1 text-left text-[14px] transition-colors sm:py-0.5 sm:text-[12.5px]',
            'hover:bg-accent',
            type === 'textarea' ? 'whitespace-pre-line' : 'truncate',
            // Телефон і email не розтягуємо: кнопки дзвінка й копіювання мають бути поруч.
            type === 'phone' || type === 'email' ? 'shrink' : 'flex-1',
            value ? 'text-ink' : 'text-ink-faint italic',
          )}
        >
          {value ? formatValue(value, type, options) : (placeholder ?? 'не вказано')}
          {hint && value ? <span className="text-ink-faint"> · {hint}</span> : null}
        </button>

        {value && (type === 'phone' || type === 'email') ? (
          <QuickActions value={value} type={type} />
        ) : null}

        <Pencil className="text-ink-faint size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Row>
  );
};

const Row = ({
  label,
  labelHidden,
  children,
}: {
  label: string;
  labelHidden?: boolean;
  children: ReactNode;
}) =>
  labelHidden ? (
    <div className="min-w-0">{children}</div>
  ) : (
    <div className="grid gap-0.5 sm:grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] sm:items-center sm:gap-2">
      <span className="text-ink-faint text-[12.5px] sm:text-[11.5px]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );

/** Телефон і email частіше набирають, ніж читають, тож дії поруч. */
const QuickActions = ({ value, type }: { value: string; type: 'phone' | 'email' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      toast.error('Не вдалося скопіювати');
    }
  };

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <a
        href={`${type === 'phone' ? 'tel:' : 'mailto:'}${value}`}
        title={type === 'phone' ? 'Подзвонити' : 'Написати'}
        className="text-ink-faint hover:text-primary grid size-7 place-items-center rounded-full transition-colors"
      >
        {type === 'phone' ? '☎' : '✉'}
      </a>
      <button
        type="button"
        title="Скопіювати"
        aria-label={`Скопіювати ${value}`}
        onClick={() => void copy()}
        className="text-ink-faint hover:text-foreground grid size-7 cursor-pointer place-items-center rounded-full transition-colors"
      >
        {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  );
};

const formatValue = (value: string, type: InlineFieldType, options?: InlineFieldOption[]) => {
  if (type === 'select') return options?.find((option) => option.value === value)?.label ?? value;
  if (type === 'date') return new Date(value).toLocaleDateString('uk-UA');

  return value;
};
