import type { UseFormRegister } from 'react-hook-form';

import type { Community } from '@/services';

import type { PersonValues } from './person-form';

type CommunityCheckboxesProps = {
  communities: Community[];
  register: UseFormRegister<PersonValues>;
  error?: string;
};

/** The same membership picker is used when a person is added and edited. */
export const CommunityCheckboxes = ({ communities, register, error }: CommunityCheckboxesProps) => (
  <fieldset className="grid gap-2 sm:col-span-2">
    <legend className="text-ink text-[13px] font-medium">Спільноти</legend>
    {communities.length === 0 ? (
      <p className="text-ink-faint text-[12.5px]">Спільнот ще немає</p>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2">
        {communities.map((community) => (
          <label
            key={community.id}
            className="border-input-border hover:bg-accent flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors"
          >
            <input
              type="checkbox"
              value={community.id}
              className="accent-primary size-3.5"
              {...register('communityIds')}
            />
            <span className="min-w-0 truncate">{community.name}</span>
          </label>
        ))}
      </div>
    )}
    {error ? <p className="text-destructive text-[11.5px]">{error}</p> : null}
  </fieldset>
);
