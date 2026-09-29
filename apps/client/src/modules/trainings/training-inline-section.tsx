import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, CardContent, Field } from '@/components/ui';
import { SettingsSection } from '@/components/settings-section';
import { getApiErrorMessage } from '@/lib/api-error';
import { PersonCombobox } from '@/components/person-combobox';
import { usePersonChoices } from '@/modules/people';
import type { Training } from '@/services';

import { trainingSchema, type TrainingValues } from './training-form';
import { useUpdateTraining } from './hooks';

export const TrainingInlineSection = ({ training }: { training: Training }) => {
  const { data: people = [] } = usePersonChoices();
  const { updateTraining, isPending } = useUpdateTraining(training.id);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TrainingValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: { name: training.name, leaderId: training.leader?.id ?? '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    if (!isDirty) reset({ name: training.name, leaderId: training.leader?.id ?? '' });
  }, [isDirty, reset, training.leader?.id, training.name]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedTraining = await updateTraining({
        name: values.name,
        leaderId: values.leaderId || null,
      });
      reset({ name: updatedTraining.name, leaderId: updatedTraining.leader?.id ?? '' });
      toast.success('Зміни збережено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
    }
  });

  return (
    <SettingsSection>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="grid gap-4 p-5">
          <Field label="Назва" error={errors.name?.message} {...register('name')} />
          <Controller
            control={control}
            name="leaderId"
            render={({ field }) => (
              <PersonCombobox
                label="Лідер"
                id="leaderId"
                people={people}
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                error={errors.leaderId?.message}
              />
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!isDirty || isPending}>
              <Save />
              {isPending ? 'Зберігаємо…' : 'Зберегти'}
            </Button>
          </div>
        </CardContent>
      </form>
    </SettingsSection>
  );
};
