import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { PersonCombobox } from '@/components/person-combobox';
import { Skeleton } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth';
import { CareOrigin, UserRole, type Care, type Person } from '@/services';

import { useAssignCare, useCloseCare, usePersonCares, usePersonChoices } from './hooks';
import { SectionCard } from './section-card';

/** Звідки взялася опіка. Автоматичну руками не чіпають — вона ходить за участю. */
const ORIGIN_LABELS: Record<CareOrigin, string> = {
  ASSIGNED: 'призначено',
  HOME_GROUP: 'домашня група',
  CONNECT: 'конект',
};

const isAssignable = (roles: UserRole[] | undefined, role: UserRole) =>
  (roles ?? [role]).some((item) => item === UserRole.SUPERADMIN || item === UserRole.ADMIN);

/**
 * Хто відповідає за людину. Це не команда й не структура: саме опіка відкриває
 * пасторський шар картки, тому видно її окремо й одразу.
 */
export const PersonCareSection = ({ person }: { person: Person }) => {
  const { user } = useAuth();
  const { data: cares = [], isPending } = usePersonCares(person.id);
  const { assignCare } = useAssignCare(person.id);
  const { closeCare } = useCloseCare(person.id);
  const [isAdding, setIsAdding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canAssign = user ? isAssignable(user.roles, user.role) : false;
  const active = cares.filter(({ until }) => until === null);
  const closed = cares.filter(({ until }) => until !== null);

  const assign = async (caregiverId: string) => {
    if (!caregiverId) return;

    try {
      await assignCare(caregiverId);
      setIsAdding(false);
      toast.success('Попечителя призначено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося призначити попечителя'));
    }
  };

  const close = async (care: Care) => {
    try {
      await closeCare(care.id);
      toast.success('Опіку завершено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося завершити опіку'));
    }
  };

  return (
    <SectionCard
      title={active.length > 0 ? `Опіка · ${active.length}` : 'Опіка'}
      action={
        canAssign && !isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-ink-faint hover:text-foreground flex cursor-pointer items-center gap-1 text-[12px] transition-colors"
          >
            <Plus className="size-3.5" />
            Попечитель
          </button>
        ) : null
      }
    >
      {isPending ? (
        <Skeleton className="h-6" />
      ) : (
        <div className="grid gap-1.5">
          {active.length === 0 && !isAdding ? (
            <p className="text-ink-faint text-[12.5px]">
              Попечителя не призначено — картку бачать лише адміни й пастор.
            </p>
          ) : null}

          {active.map((care) => (
            <CareRow
              key={care.id}
              care={care}
              canClose={canAssign && care.origin === CareOrigin.ASSIGNED}
              onClose={() => void close(care)}
            />
          ))}

          {isAdding ? (
            <AddCare
              excludedId={person.id}
              onAssign={(id) => void assign(id)}
              onCancel={() => setIsAdding(false)}
            />
          ) : null}

          {closed.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowHistory((current) => !current)}
              className="text-ink-faint hover:text-foreground mt-0.5 cursor-pointer text-left text-[11.5px] transition-colors"
            >
              {showHistory ? 'Сховати' : `Раніше опікувались: ${closed.length}`}
            </button>
          ) : null}

          {showHistory
            ? closed.map((care) => <CareRow key={care.id} care={care} canClose={false} />)
            : null}
        </div>
      )}
    </SectionCard>
  );
};

const CareRow = ({
  care,
  canClose,
  onClose,
}: {
  care: Care;
  canClose: boolean;
  onClose?: () => void;
}) => {
  const name = [care.caregiver.firstName, care.caregiver.lastName].filter(Boolean).join(' ');
  const isClosed = care.until !== null;

  return (
    <div className="group flex items-center gap-2 text-[13px]">
      <span className={cn('min-w-0 flex-1 truncate', isClosed && 'text-ink-faint')}>
        {name}
        <span className="text-ink-faint text-[11.5px]">
          {' · '}
          {ORIGIN_LABELS[care.origin]}
          {isClosed ? ` · до ${formatDate(care.until!)}` : ''}
        </span>
      </span>

      {canClose ? (
        <button
          type="button"
          title="Завершити опіку"
          aria-label={`Завершити опіку: ${name}`}
          onClick={onClose}
          className="text-ink-faint hover:text-destructive grid size-6 shrink-0 cursor-pointer place-items-center rounded-full opacity-0 transition-colors group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
};

const AddCare = ({
  excludedId,
  onAssign,
  onCancel,
}: {
  excludedId: string;
  onAssign: (caregiverId: string) => void;
  onCancel: () => void;
}) => {
  const { data: choices = [] } = usePersonChoices();

  return (
    <div className="mt-1 grid gap-1.5">
      <PersonCombobox
        id={`care-${excludedId}`}
        // Людина не опікується сама собою — база це теж не дозволить.
        people={choices.filter(({ id }) => id !== excludedId)}
        value=""
        ariaLabel="Кого призначити попечителем"
        placeholder="Кого призначити попечителем"
        emptyLabel="Не обрано"
        inputClassName="h-9 text-[13px]"
        onChange={onAssign}
      />
      <button
        type="button"
        onClick={onCancel}
        className="text-ink-faint hover:text-foreground w-fit cursor-pointer text-[12px] transition-colors"
      >
        Скасувати
      </button>
    </div>
  );
};
