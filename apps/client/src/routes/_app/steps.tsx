import { createFileRoute } from '@tanstack/react-router';
import { ArchiveRestore, ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState, type DragEvent, type ReactNode } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout';
import { Button, Input, Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { stepTypesQueryOptions, useStepTypeActions, useStepTypes } from '@/modules/steps';

export const Route = createFileRoute('/_app/steps')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(stepTypesQueryOptions(true));
  },
  component: StepTypesPage,
});

function StepTypesPage() {
  const { data: stepTypes = [], isPending, error } = useStepTypes(true);
  const { addType, isAdding, updateType, reorderTypes, removeType } = useStepTypeActions();
  const [newName, setNewName] = useState('');
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

    await run(addType(newName.trim()), 'Не вдалося додати крок');
    setNewName('');
  };

  const move = (id: string, offset: number) => {
    const from = stepTypes.findIndex((type) => type.id === id);
    const to = from + offset;

    if (to < 0 || to >= stepTypes.length) return;

    const ids = stepTypes.map((type) => type.id);

    ids.splice(to, 0, ...ids.splice(from, 1));
    void run(reorderTypes(ids), 'Не вдалося змінити порядок');
  };

  /** Перетягнутий крок стає на місце того, над яким його відпустили. */
  const drop = (targetId: string) => {
    setDropTargetId(null);

    if (!draggedId || draggedId === targetId) return;

    const ids = stepTypes.map((type) => type.id).filter((id) => id !== draggedId);

    ids.splice(ids.indexOf(targetId), 0, draggedId);
    void run(reorderTypes(ids), 'Не вдалося змінити порядок');
  };

  const allowDrop = (event: DragEvent, id: string) => {
    event.preventDefault();
    setDropTargetId(id);
  };

  return (
    <>
      <PageHeader
        eyebrow="Структура"
        title="Кроки зростання"
        description="Те, що команда пропонує людям пройти. Порядок задає, що йде першим у списку."
      />

      <section className="bg-card border-border grid gap-4 rounded-xl border p-5">
        {error ? (
          <p className="text-destructive text-sm">{getApiErrorMessage(error)}</p>
        ) : isPending ? (
          <div className="grid gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : (
          <ol className="grid gap-2">
            {stepTypes.map((stepType, index) => (
              <li
                key={stepType.id}
                draggable
                onDragStart={() => setDraggedId(stepType.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(event) => allowDrop(event, stepType.id)}
                onDragLeave={() =>
                  setDropTargetId((current) => (current === stepType.id ? null : current))
                }
                onDrop={() => drop(stepType.id)}
                className={cn(
                  'border-input-border flex cursor-grab flex-wrap items-center gap-2 rounded-lg border px-2 py-2 transition-colors active:cursor-grabbing',
                  stepType.isArchived && 'bg-secondary/40',
                  draggedId === stepType.id && 'opacity-40',
                  dropTargetId === stepType.id &&
                    draggedId !== stepType.id &&
                    'border-primary border-dashed',
                )}
              >
                <GripVertical className="text-ink-faint size-4 shrink-0" aria-hidden />

                <Input
                  defaultValue={stepType.name}
                  maxLength={80}
                  aria-label={`Назва кроку «${stepType.name}»`}
                  className={cn('h-9 min-w-[180px] flex-1', stepType.isArchived && 'text-ink-soft')}
                  onBlur={(event) => {
                    const name = event.target.value.trim();

                    if (!name || name === stepType.name) {
                      event.target.value = stepType.name;
                      return;
                    }

                    void run(updateType({ id: stepType.id, name }), 'Не вдалося перейменувати');
                  }}
                />

                <span className="text-ink-faint w-24 shrink-0 text-[12px]">
                  {stepType.usageCount === 0 ? 'не призначений' : `у ${stepType.usageCount} людей`}
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label={`Перемістити «${stepType.name}» вище`}
                    disabled={index === 0}
                    onClick={() => move(stepType.id, -1)}
                  >
                    <ArrowUp className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={`Перемістити «${stepType.name}» нижче`}
                    disabled={index === stepTypes.length - 1}
                    onClick={() => move(stepType.id, 1)}
                  >
                    <ArrowDown className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={
                      stepType.isArchived
                        ? `Повернути «${stepType.name}» у список`
                        : `Заархівувати «${stepType.name}»`
                    }
                    active={stepType.isArchived}
                    onClick={() =>
                      void run(
                        updateType({ id: stepType.id, isArchived: !stepType.isArchived }),
                        'Не вдалося змінити крок',
                      )
                    }
                  >
                    <ArchiveRestore className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label={`Видалити «${stepType.name}»`}
                    destructive
                    onClick={() => void run(removeType(stepType.id), 'Не вдалося видалити крок')}
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
            placeholder="Новий крок, напр. «Курс для подружжя»"
            aria-label="Назва нового кроку"
            className="min-w-[220px] flex-1"
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void add()}
          />
          <Button type="button" disabled={!newName.trim() || isAdding} onClick={() => void add()}>
            <Plus />
            Додати
          </Button>
        </div>

        <p className="text-ink-faint text-[12px]">
          Крок, який комусь призначений, видалити не можна — заархівуйте його. Архівний крок не
          пропонується для нових людей, але лишається в їхніх картках.
        </p>
      </section>
    </>
  );
}

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
