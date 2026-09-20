import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { LeaderCombobox } from '@/modules/home-groups/leader-combobox';
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
    <Card className="max-w-xl">
      <form onSubmit={onSubmit} noValidate>
        <div className="border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <span className="eyebrow text-muted-foreground">Основне</span>
          <Button type="submit" size="sm" disabled={!isDirty || isPending}>
            <Save />
            {isPending ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        </div>
        <CardContent className="grid gap-4 p-5">
          <Field label="Назва" error={errors.name?.message} {...register('name')} />
          <Controller
            control={control}
            name="leaderId"
            render={({ field }) => (
              <LeaderCombobox
                id="leaderId"
                people={people}
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                error={errors.leaderId?.message}
              />
            )}
          />
        </CardContent>
      </form>
    </Card>
  );
};
