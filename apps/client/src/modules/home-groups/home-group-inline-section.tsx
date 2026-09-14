import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import type { HomeGroup } from '@/services';
import { usePersonChoices } from '@/modules/people';

import { homeGroupSchema, type HomeGroupValues } from './home-group-form';
import { useUpdateHomeGroup } from './hooks';
import { LeaderCombobox } from './leader-combobox';

export const HomeGroupInlineSection = ({ homeGroup }: { homeGroup: HomeGroup }) => {
  const { data: people = [] } = usePersonChoices();
  const { updateHomeGroup, isPending } = useUpdateHomeGroup(homeGroup.id);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<HomeGroupValues>({
    resolver: zodResolver(homeGroupSchema),
    defaultValues: {
      name: homeGroup.name,
      address: homeGroup.address ?? '',
      leaderId: homeGroup.leader?.id ?? '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    if (!isDirty) {
      reset({
        name: homeGroup.name,
        address: homeGroup.address ?? '',
        leaderId: homeGroup.leader?.id ?? '',
      });
    }
  }, [homeGroup.address, homeGroup.leader?.id, homeGroup.name, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedHomeGroup = await updateHomeGroup({
        name: values.name,
        address: values.address || null,
        leaderId: values.leaderId || null,
      });
      reset({
        name: updatedHomeGroup.name,
        address: updatedHomeGroup.address ?? '',
        leaderId: updatedHomeGroup.leader?.id ?? '',
      });
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
          <Field label="Адреса" error={errors.address?.message} {...register('address')} />
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
