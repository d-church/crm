import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Input, Select } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCommunities } from '@/modules/communities';
import { useHomeGroups } from '@/modules/home-groups';
import { useMinistries } from '@/modules/ministries';
import { useStepTypes } from '@/modules/steps';
import { useTrainings } from '@/modules/trainings';
import { PersonService, type BulkPeoplePayload, type MinistryRole } from '@/services';

import { MINISTRY_ROLES, MINISTRY_ROLE_LABELS } from './ministry-roles';
import { ACTIVITY_LABELS, ACTIVITY_STATES, MEMBERSHIP_LABELS, MEMBERSHIP_STATUSES } from './status';

type BulkAction = BulkPeoplePayload['action'];

const ACTION_LABELS: Record<BulkAction, string> = {
  ministry: 'Служіння',
  community: 'Спільнота',
  homeGroup: 'Домашня група',
  training: 'Навчання',
  step: 'Наступний крок',
  membership: 'Статус',
  activity: 'Активність',
  careNeeded: 'Потребує уваги',
};

/** Дії, де можна не лише додати, а й прибрати. */
const REMOVABLE: BulkAction[] = ['ministry', 'community', 'training', 'homeGroup'];

type BulkActionsBarProps = {
  selectedIds: string[];
  /** Скільки людей знайшов поточний фільтр — для «вибрати всіх знайдених». */
  totalMatching: number;
  onSelectAllMatching: () => void;
  onClear: () => void;
  onApplied: () => Promise<void> | void;
};

/**
 * Панель зʼявляється, щойно відмічено хоч одну людину. База тільки наповнюється,
 * тому додати два десятки людей у служіння списком — звичніша дія, ніж відкривати
 * двадцять карток.
 */
export const BulkActionsBar = ({
  selectedIds,
  totalMatching,
  onSelectAllMatching,
  onClear,
  onApplied,
}: BulkActionsBarProps) => {
  const { data: ministries = [] } = useMinistries();
  const { data: communities = [] } = useCommunities();
  const { data: homeGroups = [] } = useHomeGroups();
  const { data: trainings = [] } = useTrainings();
  const { data: stepTypes = [] } = useStepTypes();

  const [action, setAction] = useState<BulkAction>('ministry');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [targetId, setTargetId] = useState('');
  const [role, setRole] = useState<MinistryRole>('MEMBER');
  const [dueAt, setDueAt] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const targets: { id: string; name: string }[] =
    action === 'ministry'
      ? ministries
      : action === 'community'
        ? communities
        : action === 'homeGroup'
          ? homeGroups
          : action === 'training'
            ? trainings
            : action === 'step'
              ? stepTypes
              : action === 'membership'
                ? MEMBERSHIP_STATUSES.map((value) => ({
                    id: value,
                    name: MEMBERSHIP_LABELS[value],
                  }))
                : action === 'activity'
                  ? ACTIVITY_STATES.map((value) => ({ id: value, name: ACTIVITY_LABELS[value] }))
                  : [
                      { id: 'true', name: 'так' },
                      { id: 'false', name: 'ні' },
                    ];

  const needsTarget = !(mode === 'remove' && action === 'homeGroup');
  const isReady = !needsTarget || targetId !== '';

  const changeAction = (next: BulkAction) => {
    setAction(next);
    setTargetId('');
    setMode('add');
  };

  const apply = async () => {
    setIsApplying(true);

    try {
      const { affected } = await PersonService.bulk({
        personIds: selectedIds,
        action,
        mode,
        ...(action === 'membership'
          ? { membership: targetId as never }
          : action === 'activity'
            ? { activity: targetId as never }
            : action === 'careNeeded'
              ? { careNeeded: targetId === 'true' }
              : { targetId: targetId || null }),
        ...(action === 'ministry' ? { role } : {}),
        ...(action === 'step' && dueAt ? { dueAt } : {}),
      });

      await onApplied();
      toast.success(
        affected === 0 ? 'Нічого не змінилось — у цих людей уже так' : `Змінено людей: ${affected}`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося застосувати дію'));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="border-border-muted bg-secondary flex flex-wrap items-center gap-2 border-b px-5 py-3">
      <span className="text-[13px] font-medium">Вибрано: {selectedIds.length}</span>

      {selectedIds.length < totalMatching ? (
        <Button type="button" variant="link" size="text" onClick={onSelectAllMatching}>
          Вибрати всіх знайдених ({totalMatching})
        </Button>
      ) : null}

      <span className="bg-border mx-1 hidden h-5 w-px sm:block" />

      <Select
        value={action}
        aria-label="Що зробити"
        className="h-9 text-[12.5px]"
        onChange={(event) => changeAction(event.target.value as BulkAction)}
      >
        {(Object.keys(ACTION_LABELS) as BulkAction[]).map((value) => (
          <option key={value} value={value}>
            {ACTION_LABELS[value]}
          </option>
        ))}
      </Select>

      {REMOVABLE.includes(action) ? (
        <Select
          value={mode}
          aria-label="Додати чи прибрати"
          className="h-9 text-[12.5px]"
          onChange={(event) => setMode(event.target.value as 'add' | 'remove')}
        >
          <option value="add">додати</option>
          <option value="remove">прибрати</option>
        </Select>
      ) : null}

      {needsTarget ? (
        <Select
          value={targetId}
          aria-label="Значення"
          className="h-9 min-w-[160px] text-[12.5px]"
          onChange={(event) => setTargetId(event.target.value)}
        >
          <option value="">Оберіть…</option>
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.name}
            </option>
          ))}
        </Select>
      ) : null}

      {action === 'ministry' && mode === 'add' ? (
        <Select
          value={role}
          aria-label="Роль у служінні"
          className="h-9 text-[12.5px]"
          onChange={(event) => setRole(event.target.value as MinistryRole)}
        >
          {MINISTRY_ROLES.map((value) => (
            <option key={value} value={value}>
              {MINISTRY_ROLE_LABELS[value]}
            </option>
          ))}
        </Select>
      ) : null}

      {action === 'step' ? (
        <Input
          type="date"
          value={dueAt}
          aria-label="Дедлайн кроку"
          className="h-9 w-40 text-[12.5px]"
          onChange={(event) => setDueAt(event.target.value)}
        />
      ) : null}

      <Button
        type="button"
        size="sm"
        disabled={!isReady || isApplying}
        onClick={() => void apply()}
      >
        {isApplying ? 'Застосовуємо…' : 'Застосувати'}
      </Button>

      <button
        type="button"
        onClick={onClear}
        aria-label="Зняти виділення"
        className="text-ink-faint hover:text-foreground ml-auto flex cursor-pointer items-center gap-1 text-[12.5px] transition-colors"
      >
        <X className="size-3.5" />
        Зняти
      </button>
    </div>
  );
};
