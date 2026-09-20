import type { UseFormRegister } from 'react-hook-form';

import type { Ministry } from '@/services';

import type { PersonValues } from './person-form';

type MinistryCheckboxesProps = {
  ministries: Ministry[];
  register: UseFormRegister<PersonValues>;
  error?: string;
};

/** People can serve in multiple ministries, including ones from different communities. */
export const MinistryCheckboxes = ({ ministries, register, error }: MinistryCheckboxesProps) => (
  <fieldset className="grid gap-2 sm:col-span-2">
    <legend className="text-ink text-[13px] font-medium">Служіння</legend>
    {ministries.length === 0 ? (
      <p className="text-ink-faint text-[12.5px]">Служінь ще немає</p>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2">
        {ministries.map((ministry) => (
          <label
            key={ministry.id}
            className="border-input-border hover:bg-accent flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors"
          >
            <input
              type="checkbox"
              value={ministry.id}
              className="accent-primary size-3.5"
              {...register('ministryIds')}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{ministry.name}</span>
              <span className="text-ink-faint truncate text-[11.5px]">
                {ministry.community?.name ?? 'Для всіх спільнот'}
              </span>
            </span>
          </label>
        ))}
      </div>
    )}
    {error ? <p className="text-destructive text-[11.5px]">{error}</p> : null}
  </fieldset>
);
