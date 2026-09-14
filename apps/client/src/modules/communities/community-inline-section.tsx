import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Community } from '@/services';
import { usePersonChoices } from '@/modules/people';

import { communitySchema, type CommunityValues } from './community-form';
import { useUpdateCommunity } from './hooks';
import { LeaderCombobox } from '../home-groups/leader-combobox';

export const CommunityInlineSection = ({ community }: { community: Community }) => {
  const { data: people = [] } = usePersonChoices();
  const { updateCommunity, isPending } = useUpdateCommunity(community.id);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: community.name, leaderId: community.leader?.id ?? '' },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    if (!isDirty) reset({ name: community.name, leaderId: community.leader?.id ?? '' });
  }, [community.leader?.id, community.name, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedCommunity = await updateCommunity({
        name: values.name,
        leaderId: values.leaderId || null,
      });
      reset({ name: updatedCommunity.name, leaderId: updatedCommunity.leader?.id ?? '' });
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
