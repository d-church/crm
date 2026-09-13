import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, Field } from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Community } from '@/services';

import { communitySchema, type CommunityValues } from './community-form';
import { useUpdateCommunity } from './hooks';

export const CommunityInlineSection = ({ community }: { community: Community }) => {
  const { updateCommunity, isPending } = useUpdateCommunity(community.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: community.name },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    if (!isDirty) reset({ name: community.name });
  }, [community.name, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updatedCommunity = await updateCommunity(values);
      reset({ name: updatedCommunity.name });
      toast.success('Зміни збережено');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося зберегти'));
    }
  });

  return (
    <Card className="max-w-xl overflow-hidden">
      <form onSubmit={onSubmit} noValidate>
        <div className="border-border-muted flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <span className="eyebrow text-muted-foreground">Основне</span>
          <Button type="submit" size="sm" disabled={!isDirty || isPending}>
            <Save />
            {isPending ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        </div>
        <CardContent className="p-5">
          <Field label="Назва" error={errors.name?.message} {...register('name')} />
        </CardContent>
      </form>
    </Card>
  );
};
