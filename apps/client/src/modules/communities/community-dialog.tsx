import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
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
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';

import { useCreateCommunity } from './hooks';
import { communitySchema, type CommunityValues } from './community-form';

export const CommunityDialog = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createCommunity, isPending } = useCreateCommunity();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommunityValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      await createCommunity(name);
      toast.success('Спільноту додано');
      reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати спільноту'));
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Нова спільнота</DialogTitle>
          <DialogDescription>Назва має бути унікальною.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          <Field
            label="Назва"
            placeholder="D.Community"
            autoFocus
            error={errors.name?.message}
            {...register('name')}
          />

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
