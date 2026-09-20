import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Label,
  Select,
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCommunities } from '@/modules/communities';

import { ministrySchema, type MinistryValues } from './ministry-form';
import { useCreateMinistry } from './hooks';

export const MinistryDialog = ({
  children,
  defaultCommunityId,
}: {
  children: ReactNode;
  defaultCommunityId?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: communities = [] } = useCommunities();
  const { createMinistry, isPending } = useCreateMinistry();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MinistryValues>({
    resolver: zodResolver(ministrySchema),
    defaultValues: { name: '', communityId: defaultCommunityId ?? '', leaderId: '' },
  });

  useEffect(() => {
    if (!isOpen) reset({ name: '', communityId: defaultCommunityId ?? '', leaderId: '' });
  }, [defaultCommunityId, isOpen, reset]);

  const onSubmit = handleSubmit(async ({ name, communityId }) => {
    try {
      await createMinistry({ name, communityId: communityId || null });
      toast.success('Служіння додано');
      reset({ name: '', communityId: defaultCommunityId ?? '', leaderId: '' });
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати служіння'));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Нове служіння</DialogTitle>
          <DialogDescription>Лідера можна призначити після створення.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          <Field label="Назва" autoFocus error={errors.name?.message} {...register('name')} />
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Скасувати
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Додаємо…' : 'Додати'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
