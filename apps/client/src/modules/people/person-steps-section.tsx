import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Card, Input, Select } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  isStepOpen,
  STEP_STATE_BADGES,
  STEP_STATE_LABELS,
  STEP_STATES,
  useAddStep,
  useRemoveStep,
  useStepTypes,
  useUpdateStep,
} from '@/modules/steps';
import type { StepState } from '@/services';
import { type Person, type PersonStep } from '@/services';

/**
 * Наступні кроки людини. Кожен крок зберігається сам по собі, одразу після зміни —
 * це журнал роботи з людиною, а не форма, яку заповнюють і надсилають цілком.
 */
export const PersonStepsSection = ({ person }: { person: Person }) => {
  const { data: stepTypes = [] } = useStepTypes();
  const { addStep, isPending: isAdding } = useAddStep(person.id);
  const { updateStep } = useUpdateStep(person.id);
  const { removeStep } = useRemoveStep(person.id);
  const [newStepTypeId, setNewStepTypeId] = useState('');

  const open = person.steps.filter(({ state }) => isStepOpen(state));
  const closed = person.steps.filter(({ state }) => !isStepOpen(state));

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
    } catch (error) {
      toast.error(getApiErrorMessage(error, failure));
    }
  };

  const add = async () => {
    if (!newStepTypeId) return;

    await run(addStep({ stepTypeId: newStepTypeId }), 'Не вдалося додати крок');
    setNewStepTypeId('');
  };

  const availableTypes = stepTypes.filter(
    ({ id }) => !open.some(({ stepTypeId }) => stepTypeId === id),
  );

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px]">Наступні кроки</h2>
        <span className="text-ink-faint text-[12px]">
          {open.length === 0 ? 'нічого не заплановано' : `${open.length} в роботі`}
        </span>
      </div>

      <div className="grid gap-2">
        {person.steps.length === 0 ? (
          <p className="text-ink-faint text-[13px]">
            Кроків ще немає. Додайте той, який команда пропонує цій людині далі.
          </p>
        ) : (
          [...open, ...closed].map((step) => (
            <StepRow
              key={step.id}
              step={step}
              onChange={(payload) =>
                void run(updateStep({ id: step.id, ...payload }), 'Не вдалося зберегти крок')
              }
              onRemove={() => void run(removeStep(step.id), 'Не вдалося прибрати крок')}
            />
          ))
        )}
      </div>

      <div className="border-border-muted flex flex-wrap items-center gap-2 border-t pt-4">
        <Select
          value={newStepTypeId}
          aria-label="Який крок додати"
          className="min-w-[200px] flex-1"
          onChange={(event) => setNewStepTypeId(event.target.value)}
        >
          <option value="">Оберіть крок…</option>
          {availableTypes.map((stepType) => (
            <option key={stepType.id} value={stepType.id}>
              {stepType.name}
            </option>
          ))}
        </Select>
        <Button type="button" disabled={!newStepTypeId || isAdding} onClick={() => void add()}>
          <Plus />
          Додати
        </Button>
      </div>
    </Card>
  );
};

type StepRowProps = {
  step: PersonStep;
  onChange: (payload: { state?: StepState; dueAt?: string | null; responsible?: string }) => void;
  onRemove: () => void;
};

const StepRow = ({ step, onChange, onRemove }: StepRowProps) => {
  const isOpen = isStepOpen(step.state);
  const isOverdue = isOpen && step.dueAt !== null && step.dueAt.slice(0, 10) < today();

  return (
    <div
      className={cn(
        'border-border-muted grid gap-2 rounded-lg border p-3',
        isOpen ? 'bg-card' : 'bg-secondary/40',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('min-w-0 flex-1 truncate text-[13.5px]', !isOpen && 'text-ink-soft')}>
          {step.stepType.name}
        </span>

        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] leading-none',
            STEP_STATE_BADGES[step.state],
          )}
        >
          {STEP_STATE_LABELS[step.state]}
          {step.completedAt ? ` · ${formatDate(step.completedAt)}` : ''}
        </span>

        <button
          type="button"
          aria-label={`Прибрати крок «${step.stepType.name}»`}
          onClick={onRemove}
          className="text-ink-faint hover:text-destructive grid size-8 cursor-pointer place-items-center rounded-full transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={step.state}
          aria-label={`Стан кроку «${step.stepType.name}»`}
          className="h-9 text-[12.5px]"
          onChange={(event) => onChange({ state: event.target.value as StepState })}
        >
          {STEP_STATES.map((state) => (
            <option key={state} value={state}>
              {STEP_STATE_LABELS[state]}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          value={step.dueAt?.slice(0, 10) ?? ''}
          aria-label={`Дедлайн кроку «${step.stepType.name}»`}
          className={cn('h-9 text-[12.5px]', isOverdue && 'border-destructive text-destructive')}
          onChange={(event) => onChange({ dueAt: event.target.value || null })}
        />

        <Input
          defaultValue={step.responsible ?? ''}
          placeholder="Відповідальний"
          aria-label={`Відповідальний за крок «${step.stepType.name}»`}
          maxLength={80}
          className="h-9 text-[12.5px]"
          // Зберігаємо, коли людина закінчила вводити, а не на кожну літеру.
          onBlur={(event) =>
            event.target.value !== (step.responsible ?? '') &&
            onChange({ responsible: event.target.value })
          }
        />
      </div>
    </div>
  );
};

const today = () => new Date().toLocaleDateString('sv-SE');
