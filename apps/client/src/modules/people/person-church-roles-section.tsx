import { CircleCheckBig, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Input, Select } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useChurchRoleTypes, usePersonChurchRoles } from '@/modules/church-roles';
import type { ChurchRole, Person } from '@/services';

/**
 * Сан у церкві — диякон, пресвітер, пастор. На відміну від ролі в служінні, він
 * стосується людини загалом, тому має власний період, а не прив'язку до команди.
 */
type PersonChurchRolesProps = {
  person: Person;
  /** Додавання вмикає секція «Шлях у церкві»: сани живуть саме там. */
  isAdding: boolean;
  onAddingChange: (isAdding: boolean) => void;
};

export const PersonChurchRoles = ({ person, isAdding, onAddingChange }: PersonChurchRolesProps) => {
  const { data: roleTypes = [] } = useChurchRoleTypes();
  const { addRole, updateRole, removeRole } = usePersonChurchRoles(person.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const run = async (action: Promise<unknown>, failure: string) => {
    try {
      await action;
    } catch (error) {
      toast.error(getApiErrorMessage(error, failure));
    }
  };

  const active = person.churchRoles.filter(({ until }) => until === null);
  const available = roleTypes.filter(
    ({ id }) => !active.some(({ roleTypeId }) => roleTypeId === id),
  );

  // Порожній блок не показуємо: сан є далеко не в кожного.
  if (person.churchRoles.length === 0 && !isAdding) return null;

  return (
    <div className="grid gap-1">
      <span className="text-ink-faint text-[11.5px]">Сан у церкві</span>

      {person.churchRoles.length > 0 ? (
        <ul className="divide-border-subtle divide-y">
          {person.churchRoles.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              isExpanded={expandedId === role.id}
              onToggle={() => setExpandedId((current) => (current === role.id ? null : role.id))}
              onChange={(payload) =>
                void run(updateRole({ id: role.id, ...payload }), 'Не вдалося зберегти сан')
              }
              onRemove={() => void run(removeRole(role.id), 'Не вдалося прибрати сан')}
            />
          ))}
        </ul>
      ) : null}

      {isAdding ? (
        available.length > 0 ? (
          <Select
            autoFocus
            aria-label="Який сан додати"
            className="h-8 w-full text-[12.5px]"
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;

              onAddingChange(false);
              void run(addRole({ roleTypeId: event.target.value }), 'Не вдалося додати сан');
            }}
            onBlur={() => onAddingChange(false)}
          >
            <option value="">Оберіть сан…</option>
            {available.map((roleType) => (
              <option key={roleType.id} value={roleType.id}>
                {roleType.name}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-ink-faint text-[12px]">Усі сани з довідника вже призначені</p>
        )
      ) : null}
    </div>
  );
};

type RoleRowProps = {
  role: ChurchRole;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (payload: { since?: string | null; until?: string | null }) => void;
  onRemove: () => void;
};

const RoleRow = ({ role, isExpanded, onToggle, onChange, onRemove }: RoleRowProps) => {
  const isActive = role.until === null;
  const since = role.since?.slice(0, 10) ?? '';
  const until = role.until?.slice(0, 10) ?? '';

  const period = isActive
    ? since
      ? `з ${formatDate(since)}`
      : null
    : `${since ? `${formatDate(since)} — ` : 'до '}${formatDate(until)}`;

  return (
    <li className="group py-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer text-left text-[14px] sm:truncate sm:text-[13px]"
        >
          <span className={cn(isActive ? 'text-ink' : 'text-ink-faint')}>{role.roleType.name}</span>
          {period ? <span className="text-ink-faint text-[12px]"> · {period}</span> : null}
        </button>

        {/* Складений сан — не помилка, а факт історії, тож завершуємо, а не видаляємо. */}
        {isActive ? (
          <button
            type="button"
            title="Завершити сан"
            aria-label={`Завершити сан «${role.roleType.name}»`}
            onClick={() => onChange({ until: new Date().toLocaleDateString('sv-SE') })}
            className="text-ink-faint hover:text-primary grid size-6 shrink-0 cursor-pointer place-items-center rounded-full transition-colors"
          >
            <CircleCheckBig className="size-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          title="Прибрати сан"
          aria-label={`Прибрати сан «${role.roleType.name}»`}
          onClick={onRemove}
          className="text-ink-faint hover:text-destructive grid size-6 shrink-0 cursor-pointer place-items-center rounded-full opacity-0 transition-colors group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
          <Input
            type="date"
            value={since}
            aria-label={`Початок сану «${role.roleType.name}»`}
            className="h-8 text-[12px]"
            onChange={(event) => onChange({ since: event.target.value || null })}
          />
          <Input
            type="date"
            value={until}
            aria-label={`Завершення сану «${role.roleType.name}»`}
            className="h-8 text-[12px]"
            onChange={(event) => onChange({ until: event.target.value || null })}
          />
        </div>
      ) : null}
    </li>
  );
};
