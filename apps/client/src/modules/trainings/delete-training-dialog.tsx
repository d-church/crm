import { useState, type ReactNode } from 'react';
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
} from '@/components/ui';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Training } from '@/services';

import { useDeleteTraining } from './hooks';

export const DeleteTrainingDialog = ({
  training,
  onDeleted,
  children,
}: {
  training: Training;
  onDeleted?: () => void;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteTraining, isPending } = useDeleteTraining();
  const onConfirm = async () => {
    try {
      await deleteTraining(training.id);
      toast.success(`Навчання «${training.name}» видалено`);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Не вдалося видалити навчання'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Видалити «{training.name}»?</DialogTitle>
          <DialogDescription>
            Люди залишаться у базі, але позначка про проходження цього навчання зникне.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Скасувати
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Видаляємо…' : 'Видалити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
