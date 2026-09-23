import { Eraser, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MINISTRY_ROLE_LABELS } from '@/modules/people/ministry-roles';
import { STEP_STATE_LABELS } from '@/modules/steps';
import { UserRole, type MinistryRole, type StepState, type TimelineItem } from '@/services';

import { useAuth } from '@/modules/auth';

import { usePersonTimeline, useRemoveActivities } from './hooks';
import { PERSON_FIELDS, type PersonScalarField } from './person-field-groups';
import { SectionCard } from './section-card';
import {
  ACTIVITY_LABELS,
  FOLLOW_UP_LABELS,
  MEMBERSHIP_LABELS,
  PERSON_GENDER_LABELS_BY_VALUE,
} from './timeline-labels';

type Scope = 'all' | 'life' | 'card';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'all', label: 'Усе' },
  { value: 'life', label: 'Події людини' },
  { value: 'card', label: 'Зміни картки' },
];

/**
 * Хронологія людини від дня народження. Події її життя і операції з карткою
 * навмисно виглядають по-різному: перші — це факти, другі — сліди роботи команди.
 */
export const PersonTimeline = ({ personId }: { personId: string }) => {
  const { data: items = [], isPending, error } = usePersonTimeline(personId);
  const { user } = useAuth();
  const { removeActivities, isPending: isRemoving } = useRemoveActivities(personId);
  const [scope, setScope] = useState<Scope>('all');
  /** Режим чистки: у списку лишаються самі операції, кожну можна відмітити. */
  const [isCleaning, setIsCleaning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);

  const canClean = user?.role === UserRole.SUPERADMIN;
  const visible = items.filter((item) =>
    isCleaning ? item.category === 'card' : scope === 'all' || item.category === scope,
  );

  const stopCleaning = () => {
    setIsCleaning(false);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);

      if (!next.delete(id)) next.add(id);

      return next;
    });

  const remove = async () => {
    try {
      const { removed } = await removeActivities([...selected]);

      toast.success(`Прибрано записів: ${removed}`);
      stopCleaning();
    } catch (removeError) {
      toast.error(getApiErrorMessage(removeError, 'Не вдалося прибрати записи'));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SectionCard
      title={isCleaning ? 'Чистка журналу' : 'Хронологія'}
      action={
        <div className="flex items-center gap-2">
          {isCleaning ? (
            <button
              type="button"
              onClick={stopCleaning}
              className="text-ink-faint hover:text-foreground cursor-pointer text-[12px] transition-colors"
            >
              Готово
            </button>
          ) : (
            <>
              <div className="border-input-border inline-flex rounded-full border p-0.5">
                {SCOPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={scope === value}
                    onClick={() => setScope(value)}
                    className={cn(
                      'cursor-pointer rounded-full px-2.5 py-0.5 text-[11.5px] transition-colors',
                      scope === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-ink-faint hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Випадкові кліки лишають шум у журналі, тож суперадмін може його прибрати. */}
              {canClean ? (
                <button
                  type="button"
                  title="Прибрати зайві записи журналу"
                  aria-label="Прибрати зайві записи журналу"
                  onClick={() => setIsCleaning(true)}
                  className="text-ink-faint hover:text-foreground cursor-pointer transition-colors"
                >
                  <Eraser className="size-4" />
                </button>
              ) : null}
            </>
          )}
        </div>
      }
    >
      {error ? (
        <p className="text-destructive text-[13px]">{getApiErrorMessage(error)}</p>
      ) : isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-8" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-ink-faint text-[13px]">
          {isCleaning ? 'Журнал порожній' : 'Поки нічого не відомо'}
        </p>
      ) : (
        <>
          <ol className="grid">
            {visible.map((item) => (
              <TimelineRow
                key={item.id}
                item={item}
                isSelectable={isCleaning}
                isSelected={selected.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </ol>

          {isCleaning ? (
            <div className="border-border-muted mt-2 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-ink-faint text-[12px]">Відмічено: {selected.size}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive ml-auto"
                disabled={selected.size === 0 || isRemoving}
                onClick={() => setIsConfirming(true)}
              >
                <Trash2 />
                Прибрати
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>Прибрати записи журналу?</DialogTitle>
            <DialogDescription>
              Буде прибрано записів: {selected.size}. Саму історію людини це не зачепить, але
              відновити журнал не вийде.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsConfirming(false)}>
              Скасувати
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isRemoving}
              onClick={() => void remove()}
            >
              {isRemoving ? 'Прибираємо…' : 'Прибрати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
};

type TimelineRowProps = {
  item: TimelineItem;
  isSelectable: boolean;
  isSelected: boolean;
  onToggle: () => void;
};

const TimelineRow = ({ item, isSelectable, isSelected, onToggle }: TimelineRowProps) => {
  const isLife = item.category === 'life';

  return (
    <li
      className={cn(
        'grid gap-x-3',
        isSelectable ? 'grid-cols-[auto_auto_minmax(0,1fr)]' : 'grid-cols-[auto_minmax(0,1fr)]',
      )}
    >
      {isSelectable ? (
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Відмітити запис: ${describe(item)}`}
          className="accent-primary mt-1.5 size-3.5 cursor-pointer self-start"
          onChange={onToggle}
        />
      ) : null}
      {/* Лінія з крапкою: у подій життя вона заповнена, в операцій — порожня. */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            isLife ? 'bg-primary' : 'border-ink-faint border bg-transparent',
          )}
        />
        <span className="bg-border-subtle w-px flex-1" />
      </div>

      <div className={cn('pb-3', isLife ? 'text-ink' : 'text-ink-soft')}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-[12px]', isLife ? 'text-ink-soft' : 'text-ink-faint')}>
            {isLife ? formatDate(item.at) : formatDateTime(item.at)}
          </span>
          <span className={cn(isLife ? 'text-[13.5px]' : 'text-[12.5px]')}>{describe(item)}</span>
        </div>

        {item.actorName ? (
          <span className="text-ink-faint text-[11.5px]">{item.actorName}</span>
        ) : null}
      </div>
    </li>
  );
};

/** Текст пункту: події життя називаються прямо, операції — як дія над полем. */
const describe = (item: TimelineItem): string => {
  if (item.category === 'life') {
    return item.target ? `${item.subject}: ${item.target}` : item.subject;
  }

  const name = fieldLabel(item.subject);
  const target = item.target ? ` «${item.target}»` : '';

  switch (item.kind) {
    case 'PERSON_CREATED':
      return 'Картку створено';

    case 'RELATION_ADDED':
      return `Додано${target ? ` до${target}` : ''}${valueSuffix(item)}`;

    case 'RELATION_REMOVED':
      return `Прибрано${target ? ` з${target}` : ''}`;

    case 'STEP_ADDED':
      return `Призначено крок${target}`;

    case 'STEP_CHANGED':
      return `Крок${target}: ${value(item.subject, item.oldValue)} → ${value(item.subject, item.newValue)}`;

    case 'STEP_REMOVED':
      return `Прибрано крок${target}`;

    case 'ROLE_ASSIGNED':
      return `Призначено сан${target}`;

    case 'ROLE_CHANGED':
      return `Завершено сан${target}`;

    case 'ROLE_REMOVED':
      return `Прибрано сан${target}`;

    case 'EVENT_ADDED':
      return `Внесено ${noun(item)}${target}${item.newValue ? ` на ${formatDate(item.newValue)}` : ''}`;

    case 'EVENT_CHANGED':
      return `Змінено ${noun(item)}: ${item.oldValue} → ${item.newValue}`;

    case 'EVENT_REMOVED':
      return `Прибрано ${noun(item)}${target}`;

    default:
      return item.oldValue || item.newValue
        ? `${name}${target}: ${value(item.subject, item.oldValue)} → ${value(item.subject, item.newValue)}`
        : `${name}${target}`;
  }
};

/** Запис у знахідному: подію життя вносять, спілкування — теж, але слово інше. */
const noun = ({ subject }: TimelineItem) => (subject === 'talk' ? 'спілкування' : 'подію');

const valueSuffix = ({ subject, newValue }: TimelineItem) =>
  subject === 'ministry' && newValue
    ? ` як ${MINISTRY_ROLE_LABELS[newValue as MinistryRole].toLowerCase()}`
    : '';

const fieldLabel = (subject: string): string => {
  const known = PERSON_FIELDS[subject as PersonScalarField];

  if (known) return known.label;

  return (
    {
      community: 'Спільнота',
      homeGroup: 'Домашня група',
      ministry: 'Служіння',
      ministryRole: 'Роль у служінні',
      training: 'Навчання',
      step: 'Крок',
      event: 'Подія',
      talk: 'Спілкування',
      churchRole: 'Сан',
      person: 'Картка',
    }[subject] ?? subject
  );
};

/** Сирі значення з бази читаються погано, тож підставляємо ті самі підписи, що в UI. */
const value = (subject: string, raw?: string | null): string => {
  if (!raw) return 'порожньо';

  const labels: Record<string, string | undefined> = {
    membership: MEMBERSHIP_LABELS[raw as keyof typeof MEMBERSHIP_LABELS],
    activity: ACTIVITY_LABELS[raw as keyof typeof ACTIVITY_LABELS],
    followUp: FOLLOW_UP_LABELS[raw as keyof typeof FOLLOW_UP_LABELS],
    gender: PERSON_GENDER_LABELS_BY_VALUE[raw],
    step: STEP_STATE_LABELS[raw as StepState],
    ministryRole: MINISTRY_ROLE_LABELS[raw as MinistryRole],
    careNeeded: raw === 'true' ? 'так' : 'ні',
  };

  return labels[subject] ?? raw;
};
