import { Select } from '@/components/ui';
import { cn } from '@/lib/utils';
import { MinistryRole, type Ministry } from '@/services';

import { MINISTRY_ROLES, MINISTRY_ROLE_LABELS } from './ministry-roles';

export type MinistryAssignmentValue = { ministryId: string; role: MinistryRole };

type MinistryAssignmentsFieldProps = {
  ministries: Ministry[];
  value: MinistryAssignmentValue[];
  onChange: (value: MinistryAssignmentValue[]) => void;
  error?: string;
};

/**
 * Роль стосується участі в конкретному служінні, тому вибір служіння і вибір ролі
 * стоять поряд: одна людина може керувати одним служінням і бути помічником в іншому.
 */
export const MinistryAssignmentsField = ({
  ministries,
  value,
  onChange,
  error,
}: MinistryAssignmentsFieldProps) => {
  const roleOf = (ministryId: string) =>
    value.find((assignment) => assignment.ministryId === ministryId)?.role;

  const toggle = (ministryId: string) =>
    onChange(
      roleOf(ministryId)
        ? value.filter((assignment) => assignment.ministryId !== ministryId)
        : [...value, { ministryId, role: MinistryRole.MEMBER }],
    );

  const setRole = (ministryId: string, role: MinistryRole) =>
    onChange(
      value.map((assignment) =>
        assignment.ministryId === ministryId ? { ...assignment, role } : assignment,
      ),
    );

  return (
    <fieldset className="grid gap-2 sm:col-span-2">
      <legend className="text-ink text-[13px] font-medium">Служіння</legend>
      {ministries.length === 0 ? (
        <p className="text-ink-faint text-[12.5px]">Служінь ще немає</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {ministries.map((ministry) => {
            const role = roleOf(ministry.id);

            return (
              <div
                key={ministry.id}
                className={cn(
                  'border-input-border flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors',
                  role ? 'bg-accent' : 'hover:bg-accent',
                )}
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(role)}
                    className="accent-primary size-3.5 shrink-0"
                    onChange={() => toggle(ministry.id)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{ministry.name}</span>
                    <span className="text-ink-faint truncate text-[11.5px]">
                      {ministry.community?.name ?? 'Для всіх спільнот'}
                    </span>
                  </span>
                </label>

                {role ? (
                  <Select
                    value={role}
                    aria-label={`Роль у служінні «${ministry.name}»`}
                    className="h-8 shrink-0 px-2 text-[12.5px]"
                    onChange={(event) => setRole(ministry.id, event.target.value as MinistryRole)}
                  >
                    {MINISTRY_ROLES.map((option) => (
                      <option key={option} value={option}>
                        {MINISTRY_ROLE_LABELS[option]}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {error ? <p className="text-destructive text-[11.5px]">{error}</p> : null}
    </fieldset>
  );
};
