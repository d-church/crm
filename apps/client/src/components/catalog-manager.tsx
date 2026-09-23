import { ArchiveRestore, ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button, Input, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';

/** Спільна форма запису довідника: і кроки зростання, і сани влаштовані однаково. */
export type CatalogItem = {
  id: string;
  name: string;
  isArchived: boolean;
  usageCount: number;
};

type CatalogManagerProps = {
  items: CatalogItem[];
  isPending: boolean;
  error: unknown;
  placeholder: string;
  /** Текст під списком: чим відрізняється архівування від видалення саме тут. */
  hint: ReactNode;
  usageLabel: (count: number) => string;
  onAdd: (name: string) => Promise<unknown>;
  onUpdate: (payload: { id: string; name?: string; isArchived?: boolean }) => Promise<unknown>;
  onReorder: (ids: string[]) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
};

/**
 * Керування довідником: назви, порядок перетягуванням, архівування й видалення.
 * Порядок задає, у якій послідовності значення пропонуються в картці людини.
 */
export const CatalogManager = ({
  items,
  isPending,
  error,
  placeholder,
  hint,
  usageLabel,
  onAdd,
  onUpdate,
  onReorder,
  onRemove,
}: CatalogManagerProps) => {
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
    } catch (actionError) {
      toast.error(getApiErrorMessage(actionError, failure));
    }
  };

  const add = async () => {
    if (!newName.trim()) return;

    setIsAdding(true);
    await run(onAdd(newName.trim()), 'Не вдалося додати');
    setNewName('');
    setIsAdding(false);
  };

  const move = (id: string, offset: number) => {
    const from = items.findIndex((item) => item.id === id);
    const to = from + offset;

    if (to < 0 || to >= items.length) return;

    const ids = items.map((item) => item.id);

    ids.splice(to, 0, ...ids.splice(from, 1));
    void run(onReorder(ids), 'Не вдалося змінити порядок');
  };

  /** Перетягнутий запис стає на місце того, над яким його відпустили. */
  const drop = (targetId: string) => {
    setDropTargetId(null);

    if (!draggedId || draggedId === targetId) return;

    const ids = items.map((item) => item.id).filter((id) => id !== draggedId);

    ids.splice(ids.indexOf(targetId), 0, draggedId);
    void run(onReorder(ids), 'Не вдалося змінити порядок');
  };

  const allowDrop = (event: DragEvent, id: string) => {
    event.preventDefault();
    setDropTargetId(id);
  };

  return (
    <section className="bg-card border-border grid gap-4 rounded-xl border p-5">
      {error ? (
        <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
      ) : isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : (
        <ol className="grid gap-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetId(null);
              }}
              onDragOver={(event) => allowDrop(event, item.id)}
              onDragLeave={() =>
                setDropTargetId((current) => (current === item.id ? null : current))
              }
              onDrop={() => drop(item.id)}
              className={cn(
                'border-input-border flex cursor-grab flex-wrap items-center gap-2 rounded-lg border px-2 py-2 transition-colors active:cursor-grabbing',
                item.isArchived && 'bg-secondary/40',
                draggedId === item.id && 'opacity-40',
                dropTargetId === item.id && draggedId !== item.id && 'border-primary border-dashed',
              )}
            >
              <GripVertical className="text-ink-faint size-4 shrink-0" aria-hidden />

              <Input
                defaultValue={item.name}
                maxLength={80}
                aria-label={`Назва «${item.name}»`}
                className={cn('h-9 min-w-[180px] flex-1', item.isArchived && 'text-ink-soft')}
                onBlur={(event) => {
                  const name = event.target.value.trim();

                  if (!name || name === item.name) {
                    event.target.value = item.name;
                    return;
                  }

                  void run(onUpdate({ id: item.id, name }), 'Не вдалося перейменувати');
                }}
              />

              <span className="text-ink-faint w-28 shrink-0 text-[12px]">
                {usageLabel(item.usageCount)}
              </span>

              <div className="flex shrink-0 items-center gap-0.5">
                <IconButton
                  label={`Перемістити «${item.name}» вище`}
                  disabled={index === 0}
                  onClick={() => move(item.id, -1)}
                >
                  <ArrowUp className="size-3.5" />
                </IconButton>
                <IconButton
                  label={`Перемістити «${item.name}» нижче`}
                  disabled={index === items.length - 1}
                  onClick={() => move(item.id, 1)}
                >
                  <ArrowDown className="size-3.5" />
                </IconButton>
                <IconButton
                  label={
                    item.isArchived
                      ? `Повернути «${item.name}» у список`
                      : `Заархівувати «${item.name}»`
                  }
                  active={item.isArchived}
                  onClick={() =>
                    void run(
                      onUpdate({ id: item.id, isArchived: !item.isArchived }),
                      'Не вдалося змінити',
                    )
                  }
                >
                  <ArchiveRestore className="size-3.5" />
                </IconButton>
                <IconButton
                  label={`Видалити «${item.name}»`}
                  destructive
                  onClick={() => void run(onRemove(item.id), 'Не вдалося видалити')}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="border-border-muted flex flex-wrap items-center gap-2 border-t pt-4">
        <Input
          value={newName}
          maxLength={80}
          placeholder={placeholder}
          aria-label="Назва нового запису"
          className="min-w-[220px] flex-1"
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void add()}
        />
        <Button type="button" disabled={!newName.trim() || isAdding} onClick={() => void add()}>
          <Plus />
          Додати
        </Button>
      </div>

      <p className="text-ink-faint text-[12px]">{hint}</p>
    </section>
  );
};

type IconButtonProps = {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  active?: boolean;
};

const IconButton = ({
  label,
  children,
  onClick,
  disabled,
  destructive,
  active,
}: IconButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'grid size-8 cursor-pointer place-items-center rounded-full transition-colors disabled:cursor-default disabled:opacity-25',
      destructive
        ? 'text-ink-faint hover:text-destructive'
        : 'text-ink-faint hover:text-foreground',
      active && 'text-primary',
    )}
  >
    {children}
  </button>
);
