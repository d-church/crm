import { Check, Plus, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Input, Select } from '@/components/ui';
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
import { StepState, type Person, type PersonStep } from '@/services';

import { SectionCard } from './section-card';

/**
 * Кроки читаються як список справ: один крок — один рядок. Деталі (стан, дедлайн,
 * відповідальний) розкриваються кліком, щоб секція не займала пів екрана.
 */
export const PersonStepsSection = ({ person }: { person: Person }) => {
  const { data: stepTypes = [] } = useStepTypes();
  const { addStep } = useAddStep(person.id);
  const { updateStep } = useUpdateStep(person.id);
  const { removeStep } = useRemoveStep(person.id);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const open = person.steps.filter(({ state }) => isStepOpen(state));
  const closed = person.steps.filter(({ state }) => !isStepOpen(state));

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
    } catch (error) {
      toast.error(getApiErrorMessage(error, failure));
    }
  };

  const availableTypes = stepTypes.filter(
    ({ id }) => !open.some(({ stepTypeId }) => stepTypeId === id),
  );

  return (
    <SectionCard
      title={open.length > 0 ? `Наступні кроки · ${open.length}` : 'Наступні кроки'}
      action={
        availableTypes.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsAdding((current) => !current)}
            className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors"
          >
            <Plus className="size-3.5" />
            Додати
          </button>
        ) : null
      }
    >
      {isAdding ? (
        <Select
          autoFocus
          aria-label="Який крок додати"
          className="mb-2 h-8 w-full text-[12.5px]"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;

            setIsAdding(false);
            void run(addStep({ stepTypeId: event.target.value }), 'Не вдалося додати крок');
          }}
        >
          <option value="">Оберіть крок…</option>
          {availableTypes.map((stepType) => (
            <option key={stepType.id} value={stepType.id}>
              {stepType.name}
            </option>
          ))}
        </Select>
      ) : null}

      {person.steps.length === 0 ? (
        <p className="text-ink-faint text-[12.5px]">Нічого не заплановано</p>
      ) : (
        <ul className="divide-border-subtle -my-1 divide-y">
          {[...open, ...closed].map((step) => (
            <StepRow
              key={step.id}
              step={step}
              isExpanded={expandedId === step.id}
              onToggle={() => setExpandedId((current) => (current === step.id ? null : step.id))}
              onChange={(payload) =>
                void run(updateStep({ id: step.id, ...payload }), 'Не вдалося зберегти крок')
              }
              onRemove={() => void run(removeStep(step.id), 'Не вдалося прибрати крок')}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
};

type StepRowProps = {
  step: PersonStep;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (payload: { state?: StepState; dueAt?: string | null; responsible?: string }) => void;
  onRemove: () => void;
};

const StepRow = ({ step, isExpanded, onToggle, onChange, onRemove }: StepRowProps) => {
  const isOpen = isStepOpen(step.state);
  const due = step.dueAt?.slice(0, 10) ?? '';
  const isOverdue = isOpen && due !== '' && due < today();

  const meta = [
    isOpen ? null : STEP_STATE_LABELS[step.state],
    due ? `${isOverdue ? 'прострочено ' : 'до '}${formatDate(due)}` : null,
    step.responsible,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="group py-1.5">
      <div className="flex items-center gap-2">
        <span
          className={cn('size-1.5 shrink-0 rounded-full', STEP_STATE_BADGES[step.state])}
          aria-hidden
        />

        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer text-left text-[14px] sm:truncate sm:text-[13px]"
        >
          <span className={cn(isOpen ? 'text-ink' : 'text-ink-faint line-through')}>
            {step.stepType.name}
          </span>
          {meta ? (
            <span
              className={cn(
                'text-[12.5px] sm:text-[11.5px]',
                isOverdue ? 'text-destructive' : 'text-ink-faint',
              )}
            >
              {' · '}
              {meta}
            </span>
          ) : null}
        </button>

        {/* Головна дія — відмітити зробленим, тож вона під рукою, а не в меню. */}
        <button
          type="button"
          title={isOpen ? 'Позначити зробленим' : 'Повернути в роботу'}
          aria-label={isOpen ? 'Позначити зробленим' : 'Повернути в роботу'}
          onClick={() => onChange({ state: isOpen ? StepState.DONE : StepState.IN_PROGRESS })}
          className="text-ink-faint hover:text-primary grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-colors"
        >
          {isOpen ? <Check className="size-3.5" /> : <Undo2 className="size-3.5" />}
        </button>

        <button
          type="button"
          title="Прибрати крок"
          aria-label={`Прибрати крок «${step.stepType.name}»`}
          onClick={onRemove}
          className="text-ink-faint hover:text-destructive grid size-6 shrink-0 cursor-pointer place-items-center rounded-full opacity-0 transition-colors group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-1.5 grid gap-1.5 pl-3.5 sm:grid-cols-3">
          <Select
            value={step.state}
            aria-label={`Стан кроку «${step.stepType.name}»`}
            className="h-8 text-[12px]"
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
            value={due}
            aria-label={`Дедлайн кроку «${step.stepType.name}»`}
            className={cn('h-8 text-[12px]', isOverdue && 'border-destructive')}
            onChange={(event) => onChange({ dueAt: event.target.value || null })}
          />

          <Input
            defaultValue={step.responsible ?? ''}
            placeholder="Відповідальний"
            aria-label={`Відповідальний за крок «${step.stepType.name}»`}
            maxLength={80}
            className="h-8 text-[12px]"
            onBlur={(event) =>
              event.target.value !== (step.responsible ?? '') &&
              onChange({ responsible: event.target.value })
            }
          />
        </div>
      ) : null}
    </li>
  );
};

const today = () => new Date().toLocaleDateString('sv-SE');
