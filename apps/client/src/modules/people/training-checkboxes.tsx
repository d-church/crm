import type { UseFormRegister } from 'react-hook-form';

import type { Training } from '@/services';

import type { PersonValues } from './person-form';

type TrainingCheckboxesProps = {
  trainings: Training[];
  register: UseFormRegister<PersonValues>;
  error?: string;
};

/** The checked set records trainings that a person has completed. */
export const TrainingCheckboxes = ({ trainings, register, error }: TrainingCheckboxesProps) => (
  <fieldset className="grid gap-2 sm:col-span-2">
    <legend className="text-ink text-[13px] font-medium">Пройдені навчання</legend>
    {trainings.length === 0 ? (
      <p className="text-ink-faint text-[12.5px]">Навчань ще немає</p>
    ) : (
      <div className="grid gap-2 sm:grid-cols-2">
        {trainings.map((training) => (
          <label
            key={training.id}
            className="border-input-border hover:bg-accent flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors"
          >
            <input
              type="checkbox"
              value={training.id}
              className="accent-primary size-3.5"
              {...register('trainingIds')}
            />
            <span className="min-w-0 truncate">{training.name}</span>
          </label>
        ))}
      </div>
    )}
    {error ? <p className="text-destructive text-[11.5px]">{error}</p> : null}
  </fieldset>
);
