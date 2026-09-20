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

import { trainingSchema, type TrainingValues } from './training-form';
import { useCreateTraining } from './hooks';

export const TrainingDialog = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { createTraining, isPending } = useCreateTraining();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrainingValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: { name: '', leaderId: '' },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      await createTraining({ name });
      toast.success('Навчання додано');
      reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося додати навчання'));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Нове навчання</DialogTitle>
          <DialogDescription>Лідера можна призначити після створення.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-5" noValidate>
          <Field label="Назва" autoFocus error={errors.name?.message} {...register('name')} />
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
