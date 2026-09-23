import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import { getColumn, PERSON_COLUMNS, REQUIRED_COLUMN_KEY, usePeopleColumns } from './people-columns';

type PeopleColumnsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STORAGE_ERROR = 'Браузер не дозволив зберегти вибір стовпців';

/** Add, remove and reorder the table's columns. Changes apply at once. */
export const PeopleColumnsDialog = ({ open, onOpenChange }: PeopleColumnsDialogProps) => {
  const { visibleKeys, setVisibleKeys, reset, isDefault } = usePeopleColumns();
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const apply = (keys: string[]) => {
    if (!setVisibleKeys(keys)) toast.error(STORAGE_ERROR);
  };

  const move = (key: string, offset: number) => {
    const from = visibleKeys.indexOf(key);
    const to = from + offset;

    if (to < 0 || to >= visibleKeys.length) return;

    const keys = [...visibleKeys];

    keys.splice(to, 0, ...keys.splice(from, 1));
    apply(keys);
  };

  /** Drops the dragged column in front of the one it was released over. */
  const drop = (targetKey: string) => {
    setDropTargetKey(null);

    if (!draggedKey || draggedKey === targetKey) return;

    const keys = visibleKeys.filter((key) => key !== draggedKey);

    keys.splice(keys.indexOf(targetKey), 0, draggedKey);
    apply(keys);
  };

  const hiddenColumns = PERSON_COLUMNS.filter(({ key }) => !visibleKeys.includes(key));

  const allowDrop = (event: DragEvent, key: string) => {
    event.preventDefault();
    setDropTargetKey(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-xl gap-4',
          'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:p-5',
        )}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>Стовпці</DialogTitle>
          <DialogDescription>
            Перетягніть, щоб змінити порядок. Вибір зберігається в цьому браузері.
          </DialogDescription>
        </DialogHeader>

        <section className="grid gap-2">
          <h3 className="text-ink-soft text-[12px]">У таблиці</h3>
          <ol className="grid gap-1">
            {visibleKeys.map((key, index) => {
              const column = getColumn(key);
              const isRequired = key === REQUIRED_COLUMN_KEY;

              if (!column) return null;

              return (
                <li
                  key={key}
                  draggable
                  onDragStart={() => setDraggedKey(key)}
                  onDragEnd={() => {
                    setDraggedKey(null);
                    setDropTargetKey(null);
                  }}
                  onDragOver={(event) => allowDrop(event, key)}
                  onDragLeave={() =>
                    setDropTargetKey((current) => (current === key ? null : current))
                  }
                  onDrop={() => drop(key)}
                  className={cn(
                    'border-input-border bg-card flex cursor-grab items-center gap-2 rounded-md border px-2 py-1.5 transition-colors active:cursor-grabbing',
                    draggedKey === key && 'opacity-40',
                    dropTargetKey === key && draggedKey !== key && 'border-primary border-dashed',
                  )}
                >
                  <GripVertical className="text-ink-faint size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{column.label}</span>

                  {/* Arrows keep this usable on a phone, where dragging does not fire. */}
                  <button
                    type="button"
                    aria-label={`Перемістити «${column.label}» вище`}
                    disabled={index === 0}
                    onClick={() => move(key, -1)}
                    className="text-ink-faint hover:text-foreground grid size-7 cursor-pointer place-items-center rounded transition-colors disabled:opacity-25 disabled:hover:text-inherit"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Перемістити «${column.label}» нижче`}
                    disabled={index === visibleKeys.length - 1}
                    onClick={() => move(key, 1)}
                    className="text-ink-faint hover:text-foreground grid size-7 cursor-pointer place-items-center rounded transition-colors disabled:opacity-25 disabled:hover:text-inherit"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Прибрати «${column.label}»`}
                    title={isRequired ? 'Імʼя прибрати не можна' : 'Прибрати стовпець'}
                    disabled={isRequired}
                    onClick={() => apply(visibleKeys.filter((item) => item !== key))}
                    className="text-ink-faint hover:text-destructive grid size-7 cursor-pointer place-items-center rounded transition-colors disabled:opacity-25 disabled:hover:text-inherit"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {hiddenColumns.length > 0 ? (
          <section className="grid gap-2">
            <h3 className="text-ink-soft text-[12px]">Доступні</h3>
            <div className="flex flex-wrap gap-1.5">
              {hiddenColumns.map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => apply([...visibleKeys, column.key])}
                  className="border-input-border text-ink hover:border-foreground hover:text-foreground flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors"
                >
                  <Plus className="size-3.5" />
                  {column.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <DialogFooter className="border-border-muted border-t pt-4">
          <Button
            type="button"
            variant="link"
            size="text"
            className="text-muted-foreground mr-auto"
            disabled={isDefault}
            onClick={() => {
              if (!reset()) toast.error(STORAGE_ERROR);
            }}
          >
            Повернути стандартні
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
