import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field, Label, Select } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCommunities } from '@/modules/communities';
import { PersonCombobox } from '@/components/person-combobox';
import { usePersonChoices } from '@/modules/people';
import type { Ministry } from '@/services';

import { ministrySchema, type MinistryValues } from './ministry-form';
import { useUpdateMinistry } from './hooks';

export const MinistryInlineSection = ({ ministry }: { ministry: Ministry }) => {
  const { data: communities = [] } = useCommunities();
  const { data: people = [] } = usePersonChoices();
  const { updateMinistry, isPending } = useUpdateMinistry(ministry.id);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MinistryValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: ministry.name,
      communityId: ministry.community?.id ?? '',
      leaderId: ministry.leader?.id ?? '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    if (!isDirty) {
      reset({
        name: ministry.name,
        communityId: ministry.community?.id ?? '',
        leaderId: ministry.leader?.id ?? '',
      });
    }
  }, [isDirty, ministry.community?.id, ministry.leader?.id, ministry.name, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedMinistry = await updateMinistry({
        name: values.name,
        communityId: values.communityId || null,
        leaderId: values.leaderId || null,
      });
      reset({
        name: updatedMinistry.name,
        communityId: updatedMinistry.community?.id ?? '',
        leaderId: updatedMinistry.leader?.id ?? '',
      });
      toast.success('Зміни збережено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
    }
  });

  return (
    <Card>
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
          <div className="grid gap-1.5">
            <Label htmlFor="communityId">Спільнота</Label>
            <Select id="communityId" {...register('communityId')}>
              <option value="">Без спільноти (для всіх)</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </Select>
            {errors.communityId ? (
              <p className="text-destructive text-[11.5px]">{errors.communityId.message}</p>
            ) : null}
          </div>
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
        </CardContent>
      </form>
    </Card>
  );
};
